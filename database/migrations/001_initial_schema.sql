-- =============================================================================
-- SBS Data Factory — Drive-to-Store DSP
-- Migration 001 : schéma initial de la base de données
-- =============================================================================
-- Moteur cible : PostgreSQL 14+
-- Objectif     : créer les tables de base nécessaires au fonctionnement de la
--                plateforme (utilisateurs, annonceurs, campagnes, magasins,
--                créatives, statistiques).
--
-- Ce fichier est idempotent : il peut être exécuté plusieurs fois sans erreur
-- grâce aux clauses "IF NOT EXISTS" / "CREATE OR REPLACE".
--
-- Pour appliquer cette migration :
--   psql "postgresql://sbs:sbs@localhost:5432/sbs_dsp" -f database/migrations/001_initial_schema.sql
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Fonction utilitaire : mise à jour automatique de la colonne "updated_at"
-- -----------------------------------------------------------------------------
-- Chaque table métier possède un déclencheur (trigger) qui appelle cette
-- fonction avant chaque UPDATE, afin de ne jamais oublier de rafraîchir
-- "updated_at" manuellement dans le code applicatif.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- Table : users
-- -----------------------------------------------------------------------------
-- Comptes de la plateforme (équipe interne / annonceurs). Chaque utilisateur
-- possède un rôle qui détermine ses droits côté application :
--   - admin        : accès complet à tous les modules
--   - media_buyer   : gestion des campagnes, magasins, créatives (pas le compte)
--   - lecteur       : consultation seule (dashboard, magasins, reporting)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id             SERIAL PRIMARY KEY,
    full_name      VARCHAR(150)  NOT NULL,
    email          VARCHAR(255)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255)  NOT NULL,
    role           VARCHAR(20)   NOT NULL DEFAULT 'lecteur'
                   CHECK (role IN ('admin', 'media_buyer', 'lecteur')),
    status         VARCHAR(20)   NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'invited', 'disabled')),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Comptes utilisateurs de la plateforme (admin, media_buyer, lecteur).';

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Table : advertisers (annonceurs)
-- -----------------------------------------------------------------------------
-- Un annonceur est le client pour le compte duquel des campagnes sont créées.
-- Un annonceur peut posséder plusieurs campagnes et plusieurs magasins.
-- =============================================================================
CREATE TABLE IF NOT EXISTS advertisers (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(150)  NOT NULL,
    sector         VARCHAR(120),
    contact_name   VARCHAR(150),
    phone          VARCHAR(30),
    email          VARCHAR(255),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE advertisers IS 'Annonceurs (clients) pour lesquels des campagnes et des magasins sont gérés.';

DROP TRIGGER IF EXISTS trg_advertisers_updated_at ON advertisers;
CREATE TRIGGER trg_advertisers_updated_at
    BEFORE UPDATE ON advertisers
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Table : campaigns (campagnes)
-- -----------------------------------------------------------------------------
-- Une campagne appartient à un seul annonceur (advertiser_id). Si l'annonceur
-- est supprimé, ses campagnes le sont aussi (ON DELETE CASCADE).
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id             SERIAL PRIMARY KEY,
    advertiser_id  INTEGER       NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
    name           VARCHAR(180)  NOT NULL,
    objective      VARCHAR(30)   NOT NULL DEFAULT 'drive_to_store'
                   CHECK (objective IN ('drive_to_store', 'awareness', 'traffic', 'conversions')),
    status         VARCHAR(20)   NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('active', 'paused', 'draft', 'completed')),
    start_date     DATE,
    end_date       DATE,
    total_budget   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_budget >= 0),
    daily_budget   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (daily_budget >= 0),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_campaigns_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

COMMENT ON TABLE campaigns IS 'Campagnes publicitaires Drive-to-Store, rattachées à un annonceur.';

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Table : stores (magasins)
-- -----------------------------------------------------------------------------
-- Un magasin appartient à un seul annonceur. Les coordonnées GPS permettront
-- le géociblage / géofencing dans un module ultérieur.
-- =============================================================================
CREATE TABLE IF NOT EXISTS stores (
    id             SERIAL PRIMARY KEY,
    advertiser_id  INTEGER       NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
    name           VARCHAR(180)  NOT NULL,
    city           VARCHAR(120),
    address        VARCHAR(255),
    latitude       NUMERIC(9, 6),
    longitude      NUMERIC(9, 6),
    opening_hours  VARCHAR(255),
    store_url      VARCHAR(255),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE stores IS 'Points de vente physiques rattachés à un annonceur.';

DROP TRIGGER IF EXISTS trg_stores_updated_at ON stores;
CREATE TRIGGER trg_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Table : creatives (créatives publicitaires)
-- -----------------------------------------------------------------------------
-- Une créative appartient à une seule campagne. Si la campagne est supprimée,
-- ses créatives le sont aussi.
-- =============================================================================
CREATE TABLE IF NOT EXISTS creatives (
    id             SERIAL PRIMARY KEY,
    campaign_id    INTEGER       NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name           VARCHAR(180)  NOT NULL,
    format         VARCHAR(20)   NOT NULL DEFAULT 'image'
                   CHECK (format IN ('image', 'html5', 'video')),
    asset_url      VARCHAR(255),
    status         VARCHAR(20)   NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE creatives IS 'Visuels / assets publicitaires utilisés par une campagne.';

DROP TRIGGER IF EXISTS trg_creatives_updated_at ON creatives;
CREATE TRIGGER trg_creatives_updated_at
    BEFORE UPDATE ON creatives
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Table : statistics (statistiques de performance)
-- -----------------------------------------------------------------------------
-- Une statistique appartient toujours à une campagne (campaign_id) et peut,
-- en plus, être rattachée à un magasin précis (store_id, nullable) lorsque la
-- donnée est mesurée au niveau du point de vente plutôt qu'au niveau global
-- de la campagne.
-- =============================================================================
CREATE TABLE IF NOT EXISTS statistics (
    id             SERIAL PRIMARY KEY,
    campaign_id    INTEGER       NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    store_id       INTEGER       REFERENCES stores(id) ON DELETE SET NULL,
    date           DATE          NOT NULL,
    impressions    INTEGER       NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    clicks         INTEGER       NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    spend          NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
    visits         INTEGER       NOT NULL DEFAULT 0 CHECK (visits >= 0),
    ctr            NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (ctr >= 0),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE statistics IS 'Statistiques quotidiennes de performance par campagne, éventuellement par magasin.';
COMMENT ON COLUMN statistics.ctr IS 'Taux de clic (click-through rate), stocké en pourcentage pour faciliter le reporting.';

DROP TRIGGER IF EXISTS trg_statistics_updated_at ON statistics;
CREATE TRIGGER trg_statistics_updated_at
    BEFORE UPDATE ON statistics
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Index utiles
-- -----------------------------------------------------------------------------
-- Les clés étrangères ne créent pas d'index automatiquement sous PostgreSQL :
-- on les ajoute explicitement pour accélérer les jointures et les filtres les
-- plus fréquents (par annonceur, par campagne, par date...).
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id  ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_stores_advertiser_id      ON stores(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign_id      ON creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_statistics_campaign_id     ON statistics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_statistics_store_id        ON statistics(store_id);
CREATE INDEX IF NOT EXISTS idx_statistics_date            ON statistics(date);
CREATE INDEX IF NOT EXISTS idx_statistics_campaign_date    ON statistics(campaign_id, date);

-- =============================================================================
-- Fin de la migration 001
-- =============================================================================
