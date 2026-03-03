-- SoloPrice Pro - Migration Script
-- Ajout des colonnes pour la marge de service et le contexte fiscal

-- Mise à jour de la table des devis
ALTER TABLE public.sp_quotes 
ADD COLUMN IF NOT EXISTS items_subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_context TEXT;

-- Mise à jour de la table des factures
ALTER TABLE public.sp_invoices 
ADD COLUMN IF NOT EXISTS items_subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_context TEXT;

-- Note : Le frontend utilise CamelCase (itemsSubtotal) mais Supabase transforme souvent en snake_case 
-- ou accepte le CamelCase si entouré de doubles quotes. 
-- Cependant, notre backend (server.js) envoie les clés telles quelles. 
-- Pour être sûr, nous allons ajouter les colonnes au format CamelCase avec doubles quotes si nécessaire, 
-- ou s'assurer que le backend/frontend parlent le même langage.

-- RE-MIGRATION avec les noms exacts utilisés par le frontend (CamelCase)
ALTER TABLE public.sp_quotes 
ADD COLUMN IF NOT EXISTS "itemsSubtotal" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "margin" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "taxContext" TEXT;

ALTER TABLE public.sp_invoices 
ADD COLUMN IF NOT EXISTS "itemsSubtotal" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "margin" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "taxContext" TEXT;
