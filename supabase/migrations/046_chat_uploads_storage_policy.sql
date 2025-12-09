-- ==========================================================================
-- Migration: 046_chat_uploads_storage_policy.sql
-- Description: Allow authenticated users to upload attachments to the chat bucket
-- ==========================================================================

CREATE POLICY "storage_objects_insert_chat_uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'chat_uploads' AND auth.role() = 'authenticated');

CREATE POLICY "storage_objects_select_chat_uploads" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'chat_uploads' AND auth.role() = 'authenticated');

CREATE POLICY "storage_objects_delete_chat_uploads" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'chat_uploads' AND auth.role() = 'authenticated');

CREATE POLICY "storage_objects_update_chat_uploads" ON storage.objects
  FOR UPDATE
  WITH CHECK (bucket_id = 'chat_uploads' AND auth.role() = 'authenticated');
