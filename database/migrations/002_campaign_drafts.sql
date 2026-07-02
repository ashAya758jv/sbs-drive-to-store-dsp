-- =============================================================================
-- SBS Data Factory — Drive-to-Store DSP
-- Migration 002 : table des brouillons de campagne (assistant multi-étapes)
-- =============================================================================
-- Moteur cible : PostgreSQL 14+
-- Objectif     : stocker les campagnes en cours de création (statut "draft")
--                produites par l'assistant de création en 4 étapes.
--
-- Les champs principaux de la campagne sont des colonnes classiques (pour
-- rester requêtables et pouvoir être promus plus tard en ligne "campaigns"),
-- tandis que les sélections détaillées de l'assistant (devices, OS, plages
-- horaires, formats, catégories d'applications, impressions estimées) sont
-- regroupées dans une colonne JSONB "payload", flexible et sans migration à
-- chaque évolution du formulaire.
--
-- Pour appliquer cette migration :
--   psql "postgresql://sbs:sbs@localhost:5432/sbs_dsp" -f database/migrations/002_campaign_drafts.sql
-- =============================================================================


-- La fonction de mise à jour de "updated_at" est (re)déclarée ici pour que
-- cette migration reste autonome, même si 001 a déjà été appliquée.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- Table : campaign_drafts (brouillons de campagne)
-- -----------------------------------------------------------------------------
-- Un brouillon peut être rattaché à un annonceur (advertiser_id). Si
-- l'annonceur est supprimé, le brouillon est conservé mais dissocié
-- (ON DELETE SET NULL).
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_drafts (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(180)  NOT NULL,
    advertiser_id  INTEGER       REFERENCES advertisers(id) ON DELETE SET NULL,
    objective      VARCHAR(30)
                   CHECK (objective IS NULL OR objective IN
                       ('drive_to_store', 'awareness', 'traffic', 'conversions')),
    status         VARCHAR(20)   NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('active', 'paused', 'draft', 'completed')),
    start_date     DATE,
    end_date       DATE,
    total_budget   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_budget >= 0),
    daily_budget   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (daily_budget >= 0),
    -- Sélections des étapes 2 à 4 (ciblage, formats, catégories, estimation).
    payload        JSONB         NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_campaign_drafts_dates
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

COMMENT ON TABLE campaign_drafts IS 'Brouillons de campagne créés par l''assistant multi-étapes (statut draft).';
COMMENT ON COLUMN campaign_drafts.payload IS 'Sélections détaillées de l''assistant : devices, OS, plages horaires, formats, catégories, impressions estimées.';

DROP TRIGGER IF EXISTS trg_campaign_drafts_updated_at ON campaign_drafts;
CREATE TRIGGER trg_campaign_drafts_updated_at
    BEFORE UPDATE ON campaign_drafts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Index utiles
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_campaign_drafts_advertiser_id ON campaign_drafts(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaign_drafts_status         ON campaign_drafts(status);

-- =============================================================================
-- Fin de la migration 002
-- =============================================================================
