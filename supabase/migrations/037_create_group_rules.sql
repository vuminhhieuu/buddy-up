-- ============================================================================
-- Migration: 037_create_group_rules.sql
-- Description: Create group_rules table for storing group rules
-- Dependencies: study_groups
-- ============================================================================

-- Group rules table
-- Stores rules for each study group
CREATE TABLE public.group_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  rule_text text NOT NULL,
  order_index int NOT NULL, -- Thứ tự hiển thị
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT group_rules_text_length CHECK (char_length(rule_text) >= 5 AND char_length(rule_text) <= 200),
  CONSTRAINT group_rules_order_positive CHECK (order_index >= 0)
);

-- Comments
COMMENT ON TABLE public.group_rules IS 'Rules for study groups';
COMMENT ON COLUMN public.group_rules.group_id IS 'Reference to study group';
COMMENT ON COLUMN public.group_rules.rule_text IS 'Rule text (5-200 characters)';
COMMENT ON COLUMN public.group_rules.order_index IS 'Display order (0 = first rule)';

-- Indexes
-- Index for querying rules by group
CREATE INDEX group_rules_group_id_idx ON public.group_rules(group_id);

-- Index for ordering rules
CREATE INDEX group_rules_group_order_idx ON public.group_rules(group_id, order_index);

-- Constraint: Maximum 10 rules per group
CREATE OR REPLACE FUNCTION check_max_group_rules()
RETURNS TRIGGER AS $$
DECLARE
  rule_count int;
BEGIN
  SELECT COUNT(*) INTO rule_count
  FROM public.group_rules
  WHERE group_id = NEW.group_id;
  
  IF rule_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 rules allowed per group';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_group_rules_trigger
  BEFORE INSERT ON public.group_rules
  FOR EACH ROW
  EXECUTE FUNCTION check_max_group_rules();

