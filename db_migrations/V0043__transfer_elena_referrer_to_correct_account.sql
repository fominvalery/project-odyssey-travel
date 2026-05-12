-- Переносим связь "Елена привлечена Фоминым" на правильный аккаунт
UPDATE t_p32045231_project_odyssey_trav.referrals
SET referred_id = '84b4a4be-a255-416d-881a-f2ce58addac0'
WHERE referred_id = '69c26a6b-ccde-4118-96ad-a4ca49a35c39';