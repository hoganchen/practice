use stock;
delimiter $$
create procedure find_target(out code_list char(6))
begin
  declare iter int;
  declare item_num int default 5;
  declare c1_code, c2_code char(6);
  declare c2_close, c2_volume, c2_ma5, c2_ma10, c2_ma20, c2_vma5, c2_vma10, c2_vma20 float;
  declare c2_date date;
  declare match_flag int default false;
  declare first_flag int default true;
  declare done int default false;
  declare min_volume, min_close float;

  declare cur1 cursor for select code from today_code_data;
  declare cur2 cursor for
    select code, date, close, volume, ma5, ma10, ma20, v_ma5, v_ma10, v_ma20
    from hist_extend_week_data where code = c1_code order by date desc limit item_num;

  -- declare not found handler
  declare continue handler for not found set done = true;

  open cur1;

  loop_label1: LOOP
    set match_flag = false;
    set first_flag = true;

    set min_volume = 0;
    set min_close = 0;

    fetch cur1 into c1_code;

    if done then
      leave loop_label1;
    end if;

    -- select c1_code;

    open cur2;

    loop_label2: LOOP
      fetch cur2 into c2_code, c2_date, c2_close, c2_volume,
        c2_ma5, c2_ma10, c2_ma20, c2_vma5, c2_vma10, c2_vma20;

      if done then
        if match_flag then
          select c2_code into code_list;
        end if;

        leave loop_label2;
      end if;

      if first_flag then
        if c2_volume < c2_ma5 * 0.6 then
          set match_flag = true;
          set min_close = c2_close;
          set min_volume = min_volume;
        else
          leave loop_label2;
        end if;

        -- select c2_code, c2_date, ma5_ma10_ratio, ma10_ma20_ratio;
      else
        if c2_volume < c2_ma5 * 0.8 then
          leave loop_label2;
        else
          iterate loop_label2;
        end if;
      end if;

    end LOOP loop_label2;

    set done = false;

    close cur2;

  end LOOP loop_label1;

  close cur1;

END $$
delimiter ;

call find_target(@code_list);
select @code_list;
drop procedure find_target;
