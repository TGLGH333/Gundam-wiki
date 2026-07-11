CREATE DATABASE IF NOT EXISTS gundam_wiki CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gundam_wiki;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  role ENUM('guest','user','editor','admin') NOT NULL DEFAULT 'user',
  contribution_score INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uk_username (username), UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wiki_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id), UNIQUE KEY uk_slug (slug), UNIQUE KEY uk_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wiki_pages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  category_id BIGINT UNSIGNED,
  content LONGTEXT NOT NULL,
  summary VARCHAR(500),
  author_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_revision INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('draft','pending','published','locked','archived') NOT NULL DEFAULT 'published',
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  extra JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uk_title (title), UNIQUE KEY uk_slug (slug), KEY idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wiki_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_id BIGINT UNSIGNED NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  content LONGTEXT NOT NULL,
  edit_summary VARCHAR(200) NOT NULL,
  editor_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  is_approved TINYINT UNSIGNED NOT NULL DEFAULT 1,
  extra JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uk_page_revision (page_id, revision_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS works (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  kit_used VARCHAR(200),
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  comment_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft','pending','published','rejected') NOT NULL DEFAULT 'published',
  extra JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forum_boards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description VARCHAR(300),
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id), UNIQUE KEY uk_slug (slug), UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forum_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_pinned TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_featured TINYINT UNSIGNED NOT NULL DEFAULT 0,
  reply_count INT UNSIGNED NOT NULL DEFAULT 0,
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('visible','hidden','pending') NOT NULL DEFAULT 'visible',
  extra JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_board (board_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tool_brands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tool_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_slug (slug), UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tools (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  reference_price DECIMAL(10,2),
  avg_rating DECIMAL(2,1),
  rating_count INT UNSIGNED NOT NULL DEFAULT 0,
  specifications JSON,
  extra JSON,
  PRIMARY KEY (id), UNIQUE KEY uk_tool_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO users (id, username, email, password_hash, nickname, role, contribution_score) VALUES
(1, 'admin', 'admin@gundamwiki.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2UeUSULJNni', '管理员', 'admin', 999),
(2, 'demo_editor', 'editor@gundamwiki.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2UeUSULJNni', '示例编辑者', 'editor', 100);

INSERT IGNORE INTO wiki_categories (id, name, slug, description, sort_order) VALUES
(1, '入门指南', 'getting-started', '面向新手的系统性入门教程', 1),
(2, '制作技法', 'techniques', '分难度等级的制作教程', 2),
(3, '模型图鉴', 'model-database', '套件参数与评价数据库', 3),
(4, '工具材料', 'tools-materials', '工具评测与选购指南', 4);

INSERT IGNORE INTO wiki_pages (id, title, slug, category_id, content, summary, current_revision, view_count, like_count, extra) VALUES
(1, 'RG 元祖高达 Ver.2.0', 'rg-rx78-2-ver2', 3, '## 套件概览\nRG 元祖高达 Ver.2.0 是面向进阶玩家与素组玩家都很友好的套件。\n\n## 制作建议\n1. 先阅读说明书并分盒收纳。\n2. 水口建议二段剪。\n3. 肩部结构较密，不要强行掰动。', 'RG系列15周年纪念作品，采用全新进阶MS关节。', 3, 24820, 913, JSON_OBJECT('tags', JSON_ARRAY('素组友好','RG','元祖','2024新品'),'grade','RG','scale','1/144','release','2024','price','3,500日元')),
(2, '新手素组全流程', 'basic-assembly-guide', 1, '## 准备工具\n剪钳、笔刀、镊子、打磨棒与收纳盒。\n\n## 标准流程\n开盒检查 → 二段剪 → 水口修整 → 组装 → 水贴 → 渗线 → 消光。', '从开盒检查到消光的第一只高达完整路线。', 2, 16500, 621, JSON_OBJECT('tags', JSON_ARRAY('新手友好','素组','水口处理'))),
(3, '渗线教程：让刻线更立体', 'panel-lining-guide', 2, '## 渗线材料选择\n白色外甲适合浅灰，彩色外甲适合深灰。\n\n## 注意\nABS件和受力关节不要大量使用强溶剂。', '渗线材料、场景与安全注意事项。', 1, 12800, 480, JSON_OBJECT('tags', JSON_ARRAY('进阶','渗线','新手友好'))),
(4, '剪钳选购指南：神之手、田宫与入门钳对比', 'nipper-buying-guide', 4, '## 选择逻辑\n预算有限先购买结实双刃钳，之后再补单刃精修钳。', '按预算与使用场景拆解剪钳选择。', 2, 20450, 745, JSON_OBJECT('tags', JSON_ARRAY('工具','剪钳','性价比之选')));

INSERT IGNORE INTO wiki_revisions (id, page_id, revision_number, content, edit_summary, editor_id, is_approved, extra) VALUES
(1, 1, 1, '创建基础条目', '创建RG元祖2.0基础条目', 2, 1, JSON_OBJECT('editor','demo_editor')),
(2, 1, 2, '补充制作建议', '补充制作建议', 2, 1, JSON_OBJECT('editor','demo_editor')),
(3, 1, 3, '加入渗线与水贴建议', '加入渗线与水贴建议', 1, 1, JSON_OBJECT('editor','admin'));

INSERT IGNORE INTO works (id, title, description, kit_used, like_count, comment_count, extra) VALUES
(1, 'RG 元祖2.0 午夜蓝改色', '使用郡士水性漆，午夜蓝主色搭配钛白。', 'RG 元祖高达 Ver.2.0', 238, 42, JSON_OBJECT('author','老刚','tags',JSON_ARRAY('全喷涂','改色','RG'),'color','from-blue-900 to-cyan-500')),
(2, 'MGEX 强袭自由金属骨架', '金色骨架分色补涂，外甲珍珠白半光效果。', 'MGEX 强袭自由', 512, 88, JSON_OBJECT('author','大师','tags',JSON_ARRAY('MGEX','金属质感'),'color','from-amber-400 to-yellow-100'));

INSERT IGNORE INTO forum_boards (id, name, slug, description, sort_order) VALUES
(1, '站务公告', 'announcements', '网站公告与活动通知', 1),
(2, '技法问答', 'technique-qa', '制作技法问答', 2),
(3, '工具避雷', 'tool-review', '工具使用体验分享', 3),
(4, '作品交流', 'work-share', '作品展示与反馈', 4);

INSERT IGNORE INTO forum_posts (id, board_id, title, content, is_pinned, is_featured, reply_count, like_count, extra) VALUES
(1, 1, '共建邀请：首批编辑者招募中', '欢迎有图文教程经验的玩家参与内容建设。', 1, 1, 31, 128, JSON_OBJECT('author','管理员')),
(2, 2, 'RG元祖2.0肩部无缝应该怎么处理？', '肩甲结构比较复杂，想确认处理顺序。', 0, 0, 18, 36, JSON_OBJECT('author','小星'));

INSERT IGNORE INTO tool_brands (id, name) VALUES (1,'神之手'),(2,'田宫'),(3,'郡士');
INSERT IGNORE INTO tool_categories (id, name, slug) VALUES (1,'剪钳/水口钳','nippers'),(2,'渗线工具','panel-lining');
INSERT IGNORE INTO tools (id, brand_id, category_id, name, reference_price, avg_rating, rating_count, specifications, extra) VALUES
(1,1,1,'SPN-120 单刃剪钳',369,4.8,126,JSON_ARRAY('单刃','适合精修','需注意维护'),JSON_OBJECT('priceLabel','¥320-420','pros',JSON_ARRAY('水口白痕少','手感细腻','适合二段剪'))),
(2,2,1,'田宫 74035 精密剪钳',155,4.5,89,JSON_ARRAY('双刃','耐用','入门友好'),JSON_OBJECT('priceLabel','¥130-180','pros',JSON_ARRAY('耐用度高','维护简单','泛用性强'))),
(3,3,2,'郡士 WC01 黑色渗线液',33,4.6,203,JSON_ARRAY('水性','黑色','适合深色阴影'),JSON_OBJECT('priceLabel','¥28-38','pros',JSON_ARRAY('流动性好','味道较轻','易清理')));
