-- 将下方邮箱替换为已经通过网站注册的管理员邮箱后执行。
update public.profiles
set role = 'admin', updated_at = now()
where email = 'your-admin@example.com';

select id, email, display_name, role
from public.profiles
where role = 'admin';
