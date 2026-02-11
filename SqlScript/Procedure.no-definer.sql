DELIMITER $$
CREATE PROCEDURE `add_coupon`(
	IN coupon_id INT(11),
	IN coupon_title varchar(100),
    IN coupon_price double,
    IN country_id int,
    IN img_link varchar(100),
    IN description_detail varchar(500),
    IN isactive boolean,
    IN startedon datetime,
    IN expireon datetime,
    IN quantity int(11),
    IN processby INT(11),
    IN coupon_typeid int(11)
)
BEGIN
	IF coupon_id = 0 THEN	
		INSERT INTO `coupon_pricing`(
			`coupon_title`,
			`coupon_price`,
			`country_id`,
			`image_link`,
			`description_detail`,
			`isactive`,
			`isdeleted`,
			`createdon`,
			`modifiedon`,
			`starton`,
			`expireon`,
			`created_by`,
			`modified_by`,
            `quantity`,
            `coupon_type_id`)
            values
            (coupon_title,coupon_price,country_id,img_link,
            description_detail,isactive,false,UTC_TIMESTAMP(),
            UTC_TIMESTAMP(),
            startedon,expireon,processby,processby,quantity,coupon_typeid);
	ELSE
		UPDATE `photomate`.`coupon_pricing`
			SET			
			`coupon_title` = coupon_title,
			`coupon_price` = coupon_price,
			`country_id` = country_id,
			`image_link` = img_link,
			`description_detail` = description_detail,
			`isactive` = isactive,			
			`modifiedon` = UTC_TIMESTAMP(),
			`starton` = startedon,
			`expireon` = expireon,			
			`modified_by` = processby,
            `quantity` = quantity,
            `coupon_type_id` = coupon_typeid
			WHERE `coupon_pricing_id` = coupon_id;
	END IF;		
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_ealbum`(
	IN ealbum_id INT,
    IN eventtitle varchar(150),
    IN userid int,
    IN coupledetail varchar(150),
    IN audioid INT,
    IN eventdate Date,
    IN remark_detail varchar(500),
    IN email varchar(100),
    IN mobileno varchar(50),
    IN pagetype varchar(10),
    IN uniqid varchar(50),
    OUT albumid_detail INT
)
BEGIN
	declare customerid int;
	IF ealbum_id = 0 THEN
		  Update customer_coupon SET total_coupon = total_coupon - 1,
			total_intransit_coupon = total_intransit_coupon + 1
			Where user_id = userid;
        
        INSERT INTO customer_detail(emailaddress,mobile,createdon,isactive,
        user_id)VALUES(email,mobileno,UTC_TIMESTAMP(),true,userid);
		
        SET customerid = LAST_INSERT_ID();
    
		INSERT INTO ealbum_detail(customer_id,user_id,event_title,
        createdon,modifiedon,couple_detail,audio_id,event_date,remarks,page_type,album_status)
        VALUES(LAST_INSERT_ID(),userid,eventtitle,UTC_TIMESTAMP(),UTC_TIMESTAMP(),
        coupledetail,audioid,eventdate,remark_detail,pagetype,'OPEN');
        
        update ealbum_detail SET uniq_id = CONCAT('MB-',customerid , LAST_INSERT_ID())
        WHERE ealbumid = LAST_INSERT_ID();
        
      
        
        SET albumid_detail = LAST_INSERT_ID();    
        
        
	ELSE
		
       SELECT customer_id INTO customerid from ealbum_detail Where 
        ealbumid = ealbum_id;
		
		UPDATE ealbum_detail SET 
        event_title = eventtitle,
        couple_detail = coupledetail,
        audio_id = audioid,
        event_date = eventdate,
        remarks = remark_detail,
        modifiedon = UTC_TIMESTAMP(),
        page_type = pagetype
        WHERE ealbumid = ealbum_id;
        
        UPDATE customer_detail SET emailaddress = email
        , mobile = mobileno WHERE customer_detail_id = customerid;
		 SET albumid_detail = ealbum_id;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_ealbum_by_lab`(IN `ealbum_id` INT, IN `eventtitle` VARCHAR(150), IN `userid` INT, IN `coupledetail` VARCHAR(150), IN `audioid` INT, IN `eventdate` DATE, IN `remark_detail` VARCHAR(500), IN `email` VARCHAR(100), IN `mobileno` VARCHAR(50), IN `pagetype` VARCHAR(10), IN `uniqid` VARCHAR(50), IN `created_by_id` INT, OUT `albumid_detail` INT)
BEGIN
declare customerid int;
	IF ealbum_id = 0 THEN
		  Update customer_coupon SET total_coupon = total_coupon - 1,
			total_intransit_coupon = total_intransit_coupon + 1
			Where user_id = userid;
        
        INSERT INTO customer_detail(emailaddress,mobile,createdon,isactive,
        user_id)VALUES(email,mobileno,UTC_TIMESTAMP(),true,userid);
		
        SET customerid = LAST_INSERT_ID();
    
		INSERT INTO ealbum_detail(customer_id,user_id,event_title,
        createdon,modifiedon,couple_detail,audio_id,event_date,remarks,page_type,album_status,created_by_user_id)
        VALUES(LAST_INSERT_ID(),userid,eventtitle,UTC_TIMESTAMP(),UTC_TIMESTAMP(),
        coupledetail,audioid,eventdate,remark_detail,pagetype,'OPEN',created_by_id);
        
        update ealbum_detail SET uniq_id = CONCAT('MB-',customerid , LAST_INSERT_ID())
        WHERE ealbumid = LAST_INSERT_ID();
        
      
        
        SET albumid_detail = LAST_INSERT_ID();    
        
        
	ELSE
		
       SELECT customer_id INTO customerid from ealbum_detail Where 
        ealbumid = ealbum_id;
		
		UPDATE ealbum_detail SET 
        event_title = eventtitle,
        couple_detail = coupledetail,
        audio_id = audioid,
        event_date = eventdate,
        remarks = remark_detail,
        modifiedon = UTC_TIMESTAMP(),
        page_type = pagetype
        WHERE ealbumid = ealbum_id;
        
        UPDATE customer_detail SET emailaddress = email
        , mobile = mobileno WHERE customer_detail_id = customerid;
		 SET albumid_detail = ealbum_id;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_ealbum_pages`(IN `albumid` INT, IN `pagelink` VARCHAR(150), IN `pagetype` VARCHAR(10), IN `pageviewtype` VARCHAR(20), IN `sequenceno` INT, IN `title` VARCHAR(150), IN `imgsize` VARCHAR(50), IN `uniqid` VARCHAR(50), IN `parentid` VARCHAR(50), IN `isalbumdisplay` BOOLEAN)
BEGIN
	DECLARE ealbumpageId INT(11);
	IF pageviewtype = 'FRONT' OR pageviewtype = 'TPFRONT' 
		OR  pageviewtype = 'BACK' OR  pageviewtype = 'TPBACK'
		THEN  
			SELECT ealbum_page_id INTO ealbumpageId from ealbum_pages WHERE page_view_type = pageviewtype  AND ealbum_id = albumid LIMIT 1;
			
            IF ealbumpageId > 0 THEN
				Update ealbum_pages SET page_link = pagelink
                WHERE ealbum_page_id = ealbumpageId;
            
            ELSE 
				INSERT INTO ealbum_pages(ealbum_id,page_link,page_type,
			is_deleted,page_view_type,page_sequence,img_title,img_size,
			parent_id,uniq_id,is_album_view)
			VALUES(albumid,pagelink,pagetype,false,pageviewtype,sequenceno
			,title,imgsize,uniqid,parentid,isalbumdisplay); 
            END IF;
                   
    ELSE	
		
			INSERT INTO ealbum_pages(ealbum_id,page_link,page_type,
			is_deleted,page_view_type,page_sequence,img_title,img_size,
			parent_id,uniq_id,is_album_view)
			VALUES(albumid,pagelink,pagetype,false,pageviewtype,sequenceno
			,title,imgsize,uniqid,parentid,isalbumdisplay);
	END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_master_detail`(
	IN master_content_id int(11),
	IN master_id int(11),
    IN master_value varchar(100),
    IN parent_id int(11),
    IN processby int(11)
)
BEGIN
	IF master_content_id =  0 THEN
		INSERT INTO master_content(master_id,master_value,parent_id,
		createdon,created_by,modifiedon,modified_by,isactive,isdeleted)
		VALUES(master_id,master_value,parent_id,UTC_TIMESTAMP(),
		processby,UTC_TIMESTAMP(),processby,true,false);
    ELSE
		UPDATE master_content
			SET master_value = master_value,
            parent_id = parent_id,
            modified_by = processby,
            modifiedon = UTC_TIMESTAMP()
		WHERE master_content_id = master_content_id;
	END IF;	
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_mp3`(
	IN mp3_id INT(11),
	IN mp3_title varchar(100),
   IN mp3_size varchar(100),
   IN mp3_duration varchar(100),
   IN mp3_link text,
    IN mp3_file_name varchar(500),
   IN mp3_description varchar(500),
    IN isactive boolean,
    IN created_by INT(11),
    IN modified_by INT(11)
  )
BEGIN
	IF mp3_id = 0 THEN	
		INSERT INTO `manage_mp3`
        (
			`mp3_title`,
			`mp3_link`,
			`mp3_size`,
			`mp3_duration`,
			`description_detail`,
            `file_name`,
			`isactive`,
			`isdeleted`,
			`createdon`,
			`modifiedon`,
			`created_by`,
			`modified_by`
            )
            values
            (mp3_title,mp3_link,mp3_size,mp3_duration,
            mp3_description,mp3_file_name,isactive,false,UTC_TIMESTAMP(),
            UTC_TIMESTAMP(),created_by,modified_by
            );
	ELSE
		UPDATE `photomate`.`manage_mp3`
			SET			
			`mp3_title` = mp3_title,
			`mp3_link` = mp3_link,
			`mp3_size` = mp3_size,
			`mp3_duration` = mp3_duration,
			`description_detail` = mp3_description,
			`isactive` = isactive,			
			`modifiedon` = UTC_TIMESTAMP(),
			`modified_by` = modified_by
			WHERE `mp3_id` = mp3_id;
	END IF;		
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_mp3_fav`(
	IN mp3id INT(11),
	IN userid INT(11),
    IN isactive bit
)
BEGIN
DECLARE mp3Count INT DEFAULT 0;

select Count(*)into mp3Count  from favourite_mp3 where 
mp3_id = mp3id and user_id = userid;

    IF mp3Count = 0 THEN	
		INSERT INTO `favourite_mp3`
        (
			`mp3_id`,
			`user_id`,
			`isactive`
			)
            values
            (mp3id,userid,isactive);
	ELSE
		UPDATE `photomate`.`favourite_mp3`
			SET			
			`isactive` = isactive
			WHERE `mp3_id` = mp3id and `user_id` = userid;
	END IF;		
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_mp3_win`(IN `mp3_id` INT, IN `mp3_title` VARCHAR(100), IN `mp3_size` VARCHAR(100), IN `mp3_duration` VARCHAR(100), IN `mp3_link` TEXT, IN `mp3_file_name` VARCHAR(500), IN `mp3_description` VARCHAR(500), IN `isactive` BOOLEAN, IN `created_by` INT, IN `modified_by` INT, OUT `mp3Id` INT)
BEGIN

INSERT INTO `manage_mp3`
        (
			`mp3_title`,
			`mp3_link`,
			`mp3_size`,
			`mp3_duration`,
			`description_detail`,
            `file_name`,
			`isactive`,
			`isdeleted`,
			`createdon`,
			`modifiedon`,
			`created_by`,
			`modified_by`
            )
            values
            (mp3_title,mp3_link,mp3_size,mp3_duration,
            mp3_description,mp3_file_name,isactive,false,UTC_TIMESTAMP(),
            UTC_TIMESTAMP(),created_by,modified_by
            );
		 SET mp3Id = LAST_INSERT_ID();
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_user`(
	IN full_name varchar(100),
    IN phone varchar(100),
    IN user_name varchar(100),
    IN user_password varchar(100),   
    IN business_type_id INT(11),
    IN isactive bool,
    IN verification_code varchar(100),
    IN emailverifieddate datetime
)
BEGIN
		INSERT INTO `register_user`(
			`user_name`,
			`user_password`,			
			`business_type_id`,
			`isactive`,
			`isdeleted`,
			`createdon`,
			`modifiedon`,
			`isemailvarified`,
			`verification_code`,
			`emailverifieddate`)
            values
            (user_name,user_password,business_type_id,
            isactive,false,UTC_TIMESTAMP(),UTC_TIMESTAMP(),false,
            verification_code,emailverifieddate);
            
            INSERT INTO `user_profile` (
            `register_user_id`, 
            `email_address`,
            `full_name`,
            `phone`,
            `createdon`, 
            `modifiedon`) 
            VALUES(LAST_INSERT_ID(),user_name,full_name,phone,UTC_TIMESTAMP(),UTC_TIMESTAMP());

END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `admin_login`(
IN username varchar(100))
BEGIN
      SELECT u.user_name As UserName, 
      'ADMIN' As BusinessType, u.administrator_user_id As UserId,
      '7' as UserTypeId, u.admin_password, p.full_name
      FROM administrator_user u          
      WHERE u.user_name = username;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `check_username_exist`(
IN register_user_id INT(11),
IN user_password varchar(100),
 OUT yes_no int )
BEGIN
IF register_user_id = 0
THEN
 SELECT count(*) INTO yes_no
      FROM register_user u
      WHERE u.user_name = user_name;   
      ELSE
       SELECT count(*) INTO yes_no
      FROM register_user u
      WHERE u.user_name = user_name && register_user_id != register_user_id;
      END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `dashboard_detail`(IN `userid` INT)
Select COUNT(created_by_user_id) as createdalbum, 'CREATED' as title
    from ealbum_detail Where created_by_user_id = userid
    UNION ALL
    Select COUNT(user_id) as createdalbum, 'UPLOADED' as title
    from ealbum_detail Where user_id = userid
    UNION ALL
    Select COUNT(user_id) as createdalbum, 'PUBLISHED' as title
    from ealbum_detail Where user_id = userid AND album_status='PUBLISHED'
     UNION ALL
    Select COUNT(user_id) as createdalbum, 'OPEN' as title
    from ealbum_detail Where user_id = userid AND album_status='OPEN'
    UNION ALL
    Select SUM(no_of_view) as createdalbum, 'VIEWALBUM' as title
    from ealbum_detail Where user_id = userid
    UNION ALL
    Select COUNT(user_id) as createdalbum, 'BYPHOTOGRAPHER' as title
    from ealbum_detail Where user_id = userid AND created_by_user_id IS NULL$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `dashboard_detail_view`(IN `userid` INT, IN `displaycode` VARCHAR(20))
BEGIN	
		SELECT ed.ealbumid,ed.customer_id,ed.user_id,ed.event_title,
		ed.createdon,ed.publishedon,ed.expireon,ed.modifiedon,
		ed.uniq_id,ed.album_status,
		ed.couple_detail, ed.audio_id,ed.event_date,ed.remarks,
		ed.page_type, cd.fullname,cd.mobile,cd.emailaddress,
		mp.mp3_title,mp.mp3_link,pg.page_link
		FROM ealbum_detail ed
		INNER JOIN customer_detail cd ON ed.customer_id = cd.customer_detail_id
		LEFT JOIN manage_mp3 mp ON ed.audio_id = mp.mp3_id  
		LEFT JOIN ealbum_pages pg ON ed.ealbumid = pg.ealbum_id AND pg.page_view_type = 'FRONT'
		WHERE  (ed.is_deleted is null OR  ed.is_deleted = 0) 
        AND 
         CASE 
			 WHEN displaycode = 'CREATED' THEN
					ed.created_by_user_id = userid 
			 WHEN displaycode = 'UPLOADED' THEN
				ed.user_id = userid 
		 WHEN displaycode = 'PUBLISHED' THEN
				ed.user_id = userid  AND ed.album_status='PUBLISHED'
		  WHEN displaycode = 'OPEN' THEN
				ed.user_id = userid  AND ed.album_status='OPEN'
		 WHEN displaycode = 'VIEWALBUM' THEN
				ed.user_id = userid 
		 WHEN displaycode = 'BYPHOTOGRAPHER' THEN
				ed.user_id = userid  AND ed.created_by_user_id IS NULL
		 END
		ORDER BY  ed.createdon DESC;

        
        
			
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `delete_album`(
	IN albumid INT,
    IN userid INT
)
BEGIN

DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING
BEGIN
    ROLLBACK;
END;

 START TRANSACTION;
	DELETE FROM ealbum_pages WHERE ealbum_id = albumid;
    DELETE FROM ealbum_detail WHERE ealbumid = albumid AND 
    user_id = userid;
    Update customer_coupon SET total_coupon = total_coupon + 1,
    total_intransit_coupon = total_intransit_coupon -1
    Where user_id = userid;
 COMMIT WORK;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `delete_almub`(
	IN albumid INT,
    IN userid INT
)
BEGIN

DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING
BEGIN
    ROLLBACK;
END;

 START TRANSACTION;
	DELETE FROM ealbum_pages WHERE ealbum_id = albumid;
    DELETE FROM ealbum_detail WHERE ealbumid = albumid AND 
    user_id = userid;
 COMMIT WORK;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `delete_coupon`(
	IN coupon_id int
)
BEGIN
	delete from coupon_pricing Where coupon_id = coupon_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `delete_entity`(
	IN entity_id int,
    IN proces_by int,
    IN entity_table_name varchar(50)
)
BEGIN
	CASE entity_table_name
		WHEN 'coupon' THEN
			update coupon_pricing set isactive = 0 , isdeleted = 1
			,modifiedon = UTC_TIMESTAMP(),
			modified_by = proces_by Where coupon_pricing_id = entity_id;		
		WHEN 'customer_coupon_request' THEN
			DELETE FROM customer_coupon_request 
            WHERE customer_coupon_request_id = entity_id;
		WHEN 'ealbum_pages' THEN
			DELETE from ealbum_pages WHERE ealbum_page_id = entity_id;
    END CASE;
	
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `delete_mp3`(
	IN mp3id int
)
BEGIN
	delete from manage_mp3 Where mp3_id = mp3id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `entity_counter`(
	entity_title varchar(500),
    entity_type varchar(20)
)
BEGIN
	
	IF entity_type = 'COUPON' THEN	
		SELECT  Count(coupon_title) AS Counter FROM coupon_pricing Where 
			coupon_title = entity_title  AND isdeleted = 0;
            END IF;	
            IF entity_type = 'Email' THEN	
		SELECT  Count(email_address) AS Counter FROM user_profile Where 
			email_address = entity_title ;
             END IF;	
               IF entity_type = 'UserName' THEN	
		SELECT  Count(user_name) AS Counter FROM register_user Where 
			user_name = entity_title ;
            END IF;
               IF entity_type = 'Mp3' THEN	
		SELECT  Count(mp3_title) AS Counter FROM manage_mp3 Where 
			mp3_title = entity_title ;
              END IF;
             IF entity_type = 'Phone' THEN	
        SELECT  Count(phone) AS Counter FROM user_profile Where 
			phone = entity_title ;
             END IF;
		   
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_album_pages`(
	IN albumId INT
)
BEGIN
	Select ealbum_page_id,ealbum_id,page_link,
    page_view_type,page_sequence,page_type,
    img_title,img_size,parent_id,uniq_id,is_album_view
    from ealbum_pages WHERE ealbum_id = albumId
    AND is_deleted = false;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_all_mp3`(
IN user_id int
)
BEGIN
	SELECT m.mp3_id,m.mp3_title,m.mp3_link, f.isdefault, f.isactive,
    m.mp3_size,m.mp3_duration,m.description_detail,m.file_name, f.user_id as 'userid'
    from  manage_mp3  m
    LEFT JOIN favourite_mp3 f ON m.mp3_id = f.mp3_id;
    
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_allmaster`()
BEGIN
select * from photomate.master_content;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_audio`(
	IN userid INT
)
BEGIN
	SELECT m.mp3_id,m.mp3_title,m.mp3_link,
    m.mp3_size,m.mp3_duration,m.description_detail,m.file_name,
    f.isactive,f.isdefault
    from  manage_mp3 m
    LEFT JOIN favourite_mp3  f ON
    m.mp3_id = f.mp3_id AND f.user_id = userid;
    
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_country_data`()
BEGIN
	Select country_id,country_code,country_name,
    currency_name,currency_symbol,isactive
    from country_detail where isactive = 1;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_coupon_by_id`(
	IN coupon_id INT(11)
)
BEGIN
	SELECT cp.coupon_pricing_id,cp.coupon_title,
    cp.coupon_price,cp.country_id,cp.image_link,cp.description_detail,
    cp.isactive,cp.isdeleted,cp.createdon,cp.modifiedon,cp.starton,
    cp.expireon,cp.created_by,cp.modified_by,cd.country_name,
    cd.currency_name,cd.currency_symbol, created.full_name as createdbyname,
    modified.full_name as modifiedbyname,cp.quantity,
    cp.coupon_type_id,
    coupontype.master_value as counpon_type_name
    FROM `coupon_pricing` cp
    INNER JOIN country_detail cd ON cp.country_id = cd.country_id
    INNER JOIN `administrator_user` created on cp.created_by = created.administrator_user_id
    INNER JOIN `administrator_user` modified on cp.modified_by = modified.administrator_user_id
    INNER JOIN  master_content coupontype on cp.coupon_type_id = coupontype.master_content_id
    WHERE coupon_pricing_id = coupon_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_coupon_detail`(
	page_index INT,
    page_size INT,
    OUT total_record INT
)
BEGIN
	DECLARE Records_Per_page INT(11);
    declare offset_value INT(11);
	
	SET offset_value = (page_index-1) * page_size;

	SELECT cp.coupon_pricing_id,cp.coupon_title,
    cp.coupon_price,cp.country_id,cp.image_link,cp.description_detail,
    cp.isactive,cp.isdeleted,cp.createdon,cp.modifiedon,cp.starton,
    cp.expireon,cp.created_by,cp.modified_by,cd.country_name,
    cd.currency_name,cd.currency_symbol, created.full_name as createdbyname,
    modified.full_name as modifiedbyname,cp.quantity, cp.coupon_type_id,
    coupontype.master_value as counpon_type_name
    FROM `coupon_pricing` cp
    INNER JOIN country_detail cd ON cp.country_id = cd.country_id
    INNER JOIN `administrator_user` created on cp.created_by = created.administrator_user_id
    INNER JOIN `administrator_user` modified on cp.modified_by = modified.administrator_user_id
    INNER JOIN  master_content coupontype on cp.coupon_type_id = coupontype.master_content_id
    WHERE cp.isdeleted != 1 AND cp.isactive = 1
    LIMIT page_size OFFSET offset_value;
    
	/* SET total_record = (SELECT COUNT(*) FROM `coupon_pricing`);*/
	
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_customer_coupon`(
	IN userid int(11)
)
BEGIN
	SELECT customer_coupon_id,user_id,total_coupon,
    total_intransit_coupon,total_used_coupon
    from  customer_coupon WHERE user_id = userid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_customer_coupon_by_status`(
	IN userid INT(11),
    IN statusid INT
)
BEGIN
	SELECT  cr.customer_coupon_request_id, cr.user_id,
     cr.coupon_id, cr.total_request_coupon_qty, cr.coupon_qty,
     cr.status_id, cr.createdon, cr.acceptedon, cr.accepted_by,
      cr.coupon_price,
     cr.accepted_quantity, cr.total_price,notes,
    cp.coupon_title, coupontype.master_value as coupon_type,
    cd.currency_symbol as symbol
    FROM customer_coupon_request  cr
    INNER JOIN   `coupon_pricing` cp
    ON cr.coupon_id = cp.coupon_pricing_id
    INNER JOIN  master_content coupontype on cp.coupon_type_id = coupontype.master_content_id
    LEFT JOIN country_detail cd ON cp.country_id = cd.country_id
    WHERE cr.user_id = userid AND cr.status_id = statusid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_customer_coupon_request`(
	IN userid INT(11),
    IN statusid INT(11),
    IN coupontypeid INT(11)
)
BEGIN
SELECT  cr.customer_coupon_request_id, cr.user_id,
     cr.coupon_id, cr.total_request_coupon_qty, cr.coupon_qty,
     cr.status_id, cr.createdon, cr.acceptedon, cr.accepted_by,
      cr.coupon_price,
     cr.accepted_quantity, cr.total_price,notes,
    cp.coupon_title, coupontype.master_value as coupon_type,
    cd.currency_symbol as symbol
    FROM customer_coupon_request  cr
    INNER JOIN   `coupon_pricing` cp
    ON cr.coupon_id = cp.coupon_pricing_id
    INNER JOIN  master_content coupontype on cp.coupon_type_id = coupontype.master_content_id
    LEFT JOIN country_detail cd ON cp.country_id = cd.country_id
    WHERE (cr.user_id = userid OR userid = 0)AND cr.status_id = statusid
    AND cp.coupon_type_id = coupontypeid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_customer_requested_coupons`(
	IN userid INT(11),
    IN statusid INT(11),
    IN coupontypeid INT(11)
)
BEGIN
SELECT  cr.customer_coupon_request_id, cr.user_id,
     cr.coupon_id, cr.total_request_coupon_qty, cr.coupon_qty,
     cr.status_id, cr.createdon, cr.acceptedon, cr.accepted_by,
      cr.coupon_price,
     cr.accepted_quantity, cr.total_price,notes,
    cp.coupon_title, coupontype.master_value as coupon_type,
    cd.currency_symbol as symbol, up.full_name,up.business_name,
    up.email_address,up.phone
    FROM customer_coupon_request  cr
    INNER JOIN   `coupon_pricing` cp
    ON cr.coupon_id = cp.coupon_pricing_id
    INNER JOIN  master_content coupontype on cp.coupon_type_id = coupontype.master_content_id
    LEFT JOIN country_detail cd ON cp.country_id = cd.country_id
	LEFT JOIN user_profile up ON cr.user_id = up.register_user_id
   WHERE (cr.user_id = userid OR userid = 0)AND cr.status_id = statusid
    AND cp.coupon_type_id = coupontypeid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_ealbum_by_uniqid`(IN `uniqid` VARCHAR(100))
BEGIN
	SELECT ed.ealbumid,ed.customer_id,ed.user_id,ed.event_title,
    ed.createdon,ed.publishedon,ed.expireon,ed.modifiedon,
    ed.couple_detail, ed.audio_id,ed.event_date,ed.remarks,
    ed.page_type, cd.fullname,cd.mobile,cd.emailaddress,   
    ed.uniq_id,ed.album_status
    FROM ealbum_detail ed
    INNER JOIN customer_detail cd ON ed.customer_id = cd.customer_detail_id   
    WHERE ed.uniq_id = uniqid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_ealbum_detail`(
	IN album_id INT,
    IN userid INT
)
BEGIN
	SELECT ed.ealbumid,ed.customer_id,ed.user_id,ed.event_title,
    ed.createdon,ed.publishedon,ed.expireon,ed.modifiedon,
    ed.couple_detail, ed.audio_id,ed.event_date,ed.remarks,
    ed.page_type, cd.fullname,cd.mobile,cd.emailaddress,
    mp.mp3_title,mp3_link,
    ed.uniq_id,ed.album_status
    FROM ealbum_detail ed
    INNER JOIN customer_detail cd ON ed.customer_id = cd.customer_detail_id
    LEFT JOIN manage_mp3 mp ON ed.audio_id = mp3_id
    WHERE ed.ealbumid = album_id AND ed.user_id = userid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_ealbum_user_id`(IN `ealbum_id` INT)
    NO SQL
SELECT user_id from ealbum_detail Where ealbumid = ealbum_id$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_ealbums`(IN `userid` INT, IN `search` VARCHAR(500), IN `page_index` INT, IN `page_size` INT, IN `album_status` VARCHAR(50), OUT `total_record` INT)
BEGIN
	DECLARE Records_Per_page INT(11);
    DECLARE offset_value INT(11);
    
    SET offset_value = (page_index-1) * page_size;
    
    SELECT ed.ealbumid,ed.customer_id,ed.user_id,ed.event_title,
    ed.createdon,ed.publishedon,ed.expireon,ed.modifiedon,
    ed.uniq_id,ed.album_status,
    ed.couple_detail, ed.audio_id,ed.event_date,ed.remarks,
    ed.page_type, cd.fullname,cd.mobile,cd.emailaddress,
    mp.mp3_title,mp.mp3_link,pg.page_link
    FROM ealbum_detail ed
    INNER JOIN customer_detail cd ON ed.customer_id = cd.customer_detail_id
    LEFT JOIN manage_mp3 mp ON ed.audio_id = mp.mp3_id  
    LEFT JOIN ealbum_pages pg ON ed.ealbumid = pg.ealbum_id AND pg.page_view_type = 'FRONT'
    WHERE ed.user_id = userid AND (ed.is_deleted is null OR  ed.is_deleted = 0)
         AND (ed.album_status = album_status OR album_status = 'ALL')
            AND ((ed.couple_detail LIKE CONCAT(search,'%') OR search = '') OR
        (ed.uniq_id like CONCAT(search,'%') OR search = ''))
    ORDER BY  ed.createdon DESC
    LIMIT page_size OFFSET offset_value;
    
    SELECT COUNT(*) INTO total_record from ealbum_detail
    WHERE user_id = userid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_forgot_password_detail`(IN `uniq_id` VARCHAR(100))
    NO SQL
BEGIN
	SELECT user_id,request_uniq_id,requested_on,
    requestexpireon,isused,forgot_pasword_id from forgot_password
    WHERE request_uniq_id = uniq_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_master_content_by_code`(
	IN master_code varchar(100)
)
BEGIN    
    Select mc.master_content_id,mc.master_id,mc.master_value,
    mc.parent_id,mc.created_by,mc.createdon,mc.modified_by,
    mc.modifiedon,mc.isactive,md.master_code,md.master_name from master_content mc
    LEFT JOIN master_detail md ON mc.master_id = md.master_id
    WHERE md.master_code IN(master_code) AND mc.isactive = 1  AND mc.isdeleted = 0;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_page_detail`(
	IN user_typeid INT(11)
)
BEGIN
	SELECT page_id,page_title,page_code,
    page_url,is_active,sequence_no,user_type_id,page_icon
    FROM page_detail where user_type_id = user_typeid and is_active = true
    ORDER BY sequence_no;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_photographer_user`(IN `username` VARCHAR(100))
BEGIN
SELECT register_user_id
FROM register_user
WHERE TRIM(LOWER(user_name)) = TRIM(LOWER(username))
    AND isactive = 1
    AND isdeleted = 0
ORDER BY (business_type_id = 1) DESC, register_user_id DESC
LIMIT 1;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_profile_by_id`(
IN register_user_id INT(11))
BEGIN
select u.full_name,u.register_user_id, u.business_name , u.email_address, u.phone,
u.business_logo, u.address1, u.address2, u.pincode,u.city, u.county, u.country
  from user_profile u
where u.register_user_id = register_user_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_setting_detail`(IN `user_type` INT)
BEGIN
	/* 7 admin login type */
	IF user_type != 7 THEN 		
			SELECT settingid,usertype,audio_upload,
            albumupload FROM user_setting Where usertype = user_type;        
	ELSE
			SELECT settingid,usertype,audio_upload,
            albumupload FROM user_setting;
	END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_user_detail_by_token`(IN `token` VARCHAR(500))
BEGIN
	Select u.user_activity_id,u.user_id,u.uniq_key,
    u.createdon,u.expireon,r.business_type_id
    from user_activity u
	INNER JOIN register_user  r on u.user_id = r.register_user_id
    Where u.uniq_key = token
      AND (u.expireon IS NULL OR u.expireon > UTC_TIMESTAMP());
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `get_user_list_by_business`(IN `page_index` INT, IN `page_size` INT, IN `search` VARCHAR(500), IN `business_id` INT(11), OUT `total_record` INT(11))
BEGIN
DECLARE Records_Per_page INT(11);
    declare offset_value INT(11);
	SET offset_value = (page_index-1) * page_size;

select u.full_name,u.register_user_id, u.business_name , u.email_address, u.phone,
u.business_logo, u.address1, u.address2, u.pincode,u.city, u.county, u.country, r.createdon, r.isactive,
r.is_window_app,r.window_app_active_date,r.window_app_deactivate_date,
r.deactivate_reason
from user_profile u
  join register_user r
  on u.register_user_id = r.register_user_id
 where r.business_type_id = business_id 
 AND ((u.full_name LIKE CONCAT('%',search,'%') OR search = '')
 OR (u.email_address LIKE CONCAT('%',search,'%') OR search = '')
 OR (u.business_name LIKE CONCAT('%',search,'%') OR search = '')
 )
 LIMIT page_size OFFSET offset_value;

 SELECT COUNT(*) INTO total_record from  user_profile u
  join register_user r
  on r.register_user_id = u.register_user_id
    WHERE r.business_type_id = business_id
    AND ((u.full_name LIKE CONCAT('%',search,'%') OR search = '')
 OR (u.email_address LIKE CONCAT('%',search,'%') OR search = '')
 OR (u.business_name LIKE CONCAT('%',search,'%') OR search = '')
 );

END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `login_token`(
 IN register_user_id int,
IN user_token varchar(100))
BEGIN
INSERT INTO user_activity(user_id,uniq_key,createdon,expireon)
values(register_user_id,user_token,UTC_TIMESTAMP(),ADDTIME(UTC_TIMESTAMP(),"0:30:0.000000"));
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `login_user`(IN `user_name` VARCHAR(100))
BEGIN
      SELECT u.user_name As UserName, 
      m.master_value As BusinessType, u.register_user_id As UserId,
      u.business_type_id as UserTypeId, u.user_password, p.full_name,p.business_logo,u.is_window_app
      FROM register_user u
      LEFT Join master_content m
      ON u.business_type_id = m.master_content_id
      LEFT Join user_profile p
      ON u.register_user_id = p.register_user_id
            WHERE (u.user_name = user_name or p.phone = user_name) AND u.isactive = 1
            ORDER BY
                CASE
                    WHEN u.user_name = user_name THEN 0
                    WHEN p.phone = user_name THEN 1
                    ELSE 2
                END,
                u.createdon DESC,
                u.register_user_id DESC;         
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `new_procedure`(
IN register_user_id INT(11))
BEGIN
select u.full_name,u.register_user_id, u.business_name , u.email_address, u.phone,
u.business_logo, u.address1, u.address2, u.pincode,u.city, u.county, u.country
  from user_profile u
where u.register_user_id = register_user_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `process_request_coupon`(
	customercouponrequestid int(11),
    couponqty int(11),
    totalrequestcouponqty int(11),
    acceptedby int(11)
)
BEGIN
	
    DECLARE userid INT(11);
    DECLARE totalqty INT(11);
    
    UPDATE customer_coupon_request SET coupon_qty = couponqty,
    total_request_coupon_qty = totalrequestcouponqty,
    acceptedon = UTC_TIMESTAMP(),accepted_by = acceptedby
    WHERE customer_coupon_request_id = customercouponrequestid;
    
    SELECT user_id INTO userid from customer_coupon_request WHERE customer_coupon_request_id = customercouponrequestid;
    SELECT COUNT(user_id) INTO totalqty FROM customer_coupon WHERE  user_id  =  userid;
    IF totalqty = 0 THEN
		INSERT INTO customer_coupon(user_id,total_coupon,
         total_intransit_coupon,total_used_coupon)
        VALUES(userid,couponqty * totalrequestcouponqty,0,0);       
	ELSE
		UPDATE customer_coupon SET total_coupon = total_coupon + (totalrequestcouponqty * couponqty)
		WHERE user_id = userid;    
	END IF;
   
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `request_coupon`(
	IN requestcouponid INT(11),
    IN userid INT(11),
    IN couponid INT(11),
    IN totalrequest INT(11),
    IN couponqty INT(11),
    IN statusid INT(11),
    IN usernotes varchar(500),
    IN couponprice decimal
)
BEGIN
	IF requestcouponid = 0 THEN
		INSERT  INTO customer_coupon_request(user_id,coupon_id,
        total_request_coupon_qty,coupon_qty,createdon,
        total_price,notes,status_id,coupon_price,
        accepted_quantity)
        VALUES(userid,couponid,totalrequest,couponqty,UTC_TIMESTAMP(),
        couponprice * totalrequest,usernotes,statusid,couponprice,
        totalrequest);
    ELSE
		UPDATE customer_coupon_request 
			SET total_request_coupon_qty = totalrequest,
            total_price = couponprice * totalrequest,
            status_id = statusid
            WHERE customer_coupon_request_id = requestcouponid;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `save_forgot_password`(IN `username` VARCHAR(100), IN `user_uniq_id` VARCHAR(100))
BEGIN
declare UserId int(11);
SELECT u.register_user_id into UserId  from  register_user u
where  user_name = username LIMIT 1;
IF UserId > 0
THEN
INSERT INTO forgot_password(user_id,request_uniq_id,requested_on,requestexpireon,isused)
values(UserId,user_uniq_id,UTC_TIMESTAMP(),DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE),false);
END IF;

END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `set_default_mp3`(
	IN mp3id int,
    IN userid int
)
BEGIN
DECLARE mp3Count INT DEFAULT 0;

select Count(*)into mp3Count  from favourite_mp3 where 
mp3_id = mp3id and user_id = userid;

    IF mp3Count = 0 THEN	
		INSERT INTO `favourite_mp3`
        (
			`mp3_id`,
			`user_id`,
			`isdefault`
			)
            values
            (mp3id,userid,true);
ELSE            update favourite_mp3 set isdefault = true where 
            mp3_id = mp3id and user_id = userid;
END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_album_status`(
	IN userid INT,
    IN albumid int,
	IN albumstatus varchar(20)
)
BEGIN
	
    UPDATE ealbum_detail SET album_status = albumstatus,
    expireon = TIMESTAMPADD(MONTH,12,UTC_TIMESTAMP())
    WHERE user_id = userid AND ealbumid = albumid;
    
    if albumstatus = 'PUBLISHED' THEN
		  Update customer_coupon SET 
			total_intransit_coupon = total_intransit_coupon - 1,
            total_used_coupon = total_used_coupon + 1
			Where user_id = userid;
    END IF;
    
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_bulk_coupon_approval`(
	IN requestid INT(11),
    IN statusid INT(11),   
    IN userid INT(11),
    IN quantity INT(11),
    IN priceperunit INT(11),
    IN detail_note varchar(500)
)
BEGIN
	 DECLARE totalqty INT(11); 
     DECLARE usercouponexist int(11);
     SET usercouponexist = 0;
    
	UPDATE customer_coupon_request SET status_id = statusid,
    coupon_qty=1,total_request_coupon_qty = quantity,
    total_price = quantity *priceperunit,
    notes = detail_note, coupon_price = priceperunit
    WHERE customer_coupon_request_id = requestid;

	SELECT user_id INTO usercouponexist FROM customer_coupon
	WHERE  user_id = userid;
        
        IF usercouponexist > 0 THEN
				UPDATE customer_coupon SET total_coupon = total_coupon + quantity
				WHERE user_id = userid;
		else
			INSERT INTO customer_coupon(user_id,total_coupon,
            total_intransit_coupon,total_used_coupon)
            VALUES(userid,quantity,0,0);
        end if;
		
         
	
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_cart_status`(
	IN requestid INT(11),
    IN statusid INT(11),
    IN isupdateqty  int(11),
    IN userid INT(11)
)
BEGIN
	 DECLARE totalqty INT(11); 
     DECLARE usercouponexist int(11);
     SET usercouponexist = 0;
    
	UPDATE customer_coupon_request SET status_id = statusid
    WHERE customer_coupon_request_id = requestid;
    
    IF isupdateqty = 1 THEN
		SELECT  coupon_qty * total_request_coupon_qty INTO totalqty
        from customer_coupon_request WHERE 
        customer_coupon_request_id = requestid;
     
		SELECT user_id INTO usercouponexist FROM customer_coupon
        WHERE  user_id = userid;
        
        IF usercouponexist > 0 THEN
				UPDATE customer_coupon SET total_coupon = total_coupon + totalqty
				WHERE user_id = userid;
		else
			INSERT INTO customer_coupon(user_id,total_coupon,
            total_intransit_coupon,total_used_coupon)
            VALUES(userid,totalqty,0,0);
        end if;
		
         
	END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_page_sequence`(
	IN ealbumid INT,
    IN elabumpageid INT,
    IN sequenceno int
)
BEGIN
	UPDATE ealbum_pages SET page_sequence = sequenceno
    WHERE ealbum_page_id = elabumpageid AND ealbum_id = ealbumid;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_password`(
IN user_name varchar(100),
IN user_password varchar(100))
BEGIN
declare UserId int(11);
SELECT u.register_user_id into UserId  from  register_user u
where  user_name = user_name;
IF UserId > 0
THEN
UPDATE  register_user set user_password = user_password , user_salt_password = user_password
where user_name = user_name;
UPDATE  forgot_password set isused = true
where user_id = UserId;
END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_profile`(
IN userId INT(11),
IN full_name varchar(45),
IN business_name varchar(100),
IN phone varchar(45),
IN business_logo varchar(100),
IN address1 varchar(100),
IN address2 varchar(100),
IN pincode varchar(15),
IN city varchar(45),
IN county varchar(45),
IN country varchar(100))
BEGIN
UPDATE `photomate`.`user_profile`
			SET			
			`full_name` = full_name,
			`business_name` = business_name,
			`phone` = phone,
			`business_logo` = business_logo,
			`address1` = address1,
			`address2` = address2,
			`modifiedon` = UTC_TIMESTAMP(),
            `modifiedon` = UTC_TIMESTAMP(),
			`pincode` = pincode,
			`city` = city,			
			`county` = county,
            `country` = country
            
			WHERE `register_user_id` = userId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_setting`(IN `setting_id` INT, IN `setting_status` BIT, IN `setting_Type` VARCHAR(10))
BEGIN
	IF setting_Type = 'AUDIO' THEN
		UPDATE user_setting SET audio_upload = setting_status WHERE settingid
			= setting_id;
    ELSE 
    	UPDATE user_setting SET albumupload = setting_status WHERE settingid
			= setting_id;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_user_status`(IN `user_id` INT, IN `active_status` BIT)
BEGIN
IF active_status = TRUE THEN	
	UPDATE register_user SET isactive = active_status,
    modifiedon = UTC_TIMESTAMP()
    WHERE register_user_id = user_id;
ELSE
	UPDATE register_user SET isactive = active_status,
    modifiedon = UTC_TIMESTAMP()
    WHERE register_user_id = user_id;
END IF;	
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `validate_customer`(IN `albumid` INT, IN `albumcode` VARCHAR(50), IN `email` VARCHAR(250), IN `mobile` VARCHAR(20))
BEGIN
	declare count_val int;
	SELECT COUNT(*) INTO count_val from ealbum_detail Where 
        ealbumid = albumid AND uniq_id=albumcode;

	IF count_val > 0 THEN
		
        IF email != '' OR mobile != '' THEN
        INSERT INTO album_view_detail(ealbum_id,email_detail,
        mobile_no,created_on)VALUES(albumid,email,mobile,UTC_TIMESTAMP());
		END IF;
        
        UPDATE ealbum_detail SET no_of_view = no_of_view +1 Where ealbumid = albumid;
        
		SELECT ed.ealbumid,ed.customer_id,ed.user_id,ed.event_title,
		ed.createdon,ed.publishedon,ed.expireon,ed.modifiedon,
		ed.couple_detail, ed.audio_id,ed.event_date,ed.remarks,
		ed.page_type, cd.fullname,cd.mobile,cd.emailaddress,
		mp.mp3_title,mp3_link,
		ed.uniq_id,ed.album_status
		FROM ealbum_detail ed
		INNER JOIN customer_detail cd ON ed.customer_id = cd.customer_detail_id
		LEFT JOIN manage_mp3 mp ON ed.audio_id = mp3_id    
		WHERE ed.ealbumid=albumid AND ed.uniq_id=albumcode;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `window_app_activation`(IN `user_id` INT, IN `active_status` BIT)
BEGIN
IF active_status = TRUE THEN	
	UPDATE register_user SET is_window_app = active_status,
    window_app_active_date = UTC_TIMESTAMP()
    WHERE register_user_id = user_id;
ELSE
	UPDATE register_user SET is_window_app = active_status,
    window_app_deactivate_date = UTC_TIMESTAMP()
    WHERE register_user_id = user_id;
END IF;	
END$$
DELIMITER ;
