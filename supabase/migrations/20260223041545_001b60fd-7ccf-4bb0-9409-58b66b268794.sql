-- Allow users to delete their own watched content
CREATE POLICY "Users can delete their own watched content"
ON public.watched_content
FOR DELETE
USING (auth.uid() = user_id);