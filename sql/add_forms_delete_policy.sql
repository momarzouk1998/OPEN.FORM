-- السماح للمشرفين والمديرين بحذف النماذج
CREATE POLICY "Supervisors and admins can delete forms" 
ON forms 
FOR DELETE 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND role IN ('supervisor'::user_role, 'admin'::user_role) 
    ) 
);
