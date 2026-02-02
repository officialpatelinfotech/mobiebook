USE photomate;

DROP PROCEDURE IF EXISTS `get_ealbums`;

DELIMITER $$
CREATE PROCEDURE `get_ealbums`(
  IN `userid` INT,
  IN `search` VARCHAR(500),
  IN `page_index` INT,
  IN `page_size` INT,
  IN `album_status` VARCHAR(50),
  OUT `total_record` INT
)
BEGIN
  DECLARE offset_value INT(11);

  SET offset_value = (page_index-1) * page_size;

  SELECT ed.ealbumid,ed.customer_id,ed.user_id,ed.event_title,
    ed.createdon,ed.publishedon,ed.expireon,ed.modifiedon,
    ed.uniq_id,ed.album_status,
    ed.couple_detail, ed.audio_id,ed.event_date,ed.remarks,
    ed.page_type, cd.fullname,cd.mobile,cd.emailaddress,
    mp.mp3_title,mp.mp3_link,pg.page_link,
    ed.created_by_user_id
  FROM ealbum_detail ed
    INNER JOIN customer_detail cd ON ed.customer_id = cd.customer_detail_id
    LEFT JOIN manage_mp3 mp ON ed.audio_id = mp.mp3_id
    LEFT JOIN ealbum_pages pg ON ed.ealbumid = pg.ealbum_id AND pg.page_view_type = 'FRONT'
  WHERE (ed.user_id = userid OR ed.created_by_user_id = userid)
    AND (ed.is_deleted IS NULL OR ed.is_deleted = 0)
    AND (ed.album_status = album_status OR album_status = 'ALL')
    AND (
      (ed.couple_detail LIKE CONCAT(search,'%') OR search = '')
      OR (ed.uniq_id LIKE CONCAT(search,'%') OR search = '')
    )
  ORDER BY ed.createdon DESC
  LIMIT page_size OFFSET offset_value;

  SELECT COUNT(*) INTO total_record
  FROM ealbum_detail ed
  WHERE (ed.user_id = userid OR ed.created_by_user_id = userid)
    AND (ed.is_deleted IS NULL OR ed.is_deleted = 0)
    AND (ed.album_status = album_status OR album_status = 'ALL')
    AND (
      (ed.couple_detail LIKE CONCAT(search,'%') OR search = '')
      OR (ed.uniq_id LIKE CONCAT(search,'%') OR search = '')
    );
END$$
DELIMITER ;
