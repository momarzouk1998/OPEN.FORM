-- Add new question types (إضافات) to the CHECK constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

ALTER TABLE questions ADD CONSTRAINT questions_type_check
  CHECK (type IN (
    'text', 'textarea', 'single_choice', 'multiple_choice',
    'scale', 'ranking', 'matrix', 'dropdown',
    'date', 'time', 'file_upload',
    'static_text', 'static_image', 'divider', 'signature',
    'star_rating', 'terms', 'date_range', 'slider',
    'button_choice', 'email_confirm', 'youtube', 'match_items',
    'appointment',
    'countdown_timer', 'products_block', 'payment_info_block'
  ));
