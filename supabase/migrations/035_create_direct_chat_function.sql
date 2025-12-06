-- ============================================================================
-- Migration: 035_create_direct_chat_function.sql
-- Description: Create a SECURITY DEFINER function to create direct chats
--              This bypasses RLS to avoid policy recursion issues
-- ============================================================================

-- Function to create a direct chat between two users
-- Returns the chat_id (existing or newly created)
CREATE OR REPLACE FUNCTION public.create_direct_chat(
  p_user_id_1 UUID,
  p_user_id_2 UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chat_id UUID;
  v_existing_chat_id UUID;
BEGIN
  -- Validate: cannot create chat with self
  IF p_user_id_1 = p_user_id_2 THEN
    RAISE EXCEPTION 'Cannot create chat with yourself';
  END IF;

  -- Check if direct chat already exists between these two users
  SELECT c.id INTO v_existing_chat_id
  FROM chats c
  WHERE c.type = 'direct'
    AND c.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM chat_participants cp1
      WHERE cp1.chat_id = c.id AND cp1.user_id = p_user_id_1
    )
    AND EXISTS (
      SELECT 1 FROM chat_participants cp2
      WHERE cp2.chat_id = c.id AND cp2.user_id = p_user_id_2
    )
  LIMIT 1;

  -- If chat exists, return it
  IF v_existing_chat_id IS NOT NULL THEN
    RETURN v_existing_chat_id;
  END IF;

  -- Create new chat
  INSERT INTO chats (type, title, created_by)
  VALUES ('direct', NULL, p_user_id_1)
  RETURNING id INTO v_chat_id;

  -- Add both users as participants
  INSERT INTO chat_participants (chat_id, user_id, role)
  VALUES 
    (v_chat_id, p_user_id_1, 'member'),
    (v_chat_id, p_user_id_2, 'member');

  RETURN v_chat_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_direct_chat(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_direct_chat(UUID, UUID) IS 
  'Creates a direct chat between two users, returns existing chat if one exists. Uses SECURITY DEFINER to bypass RLS.';

