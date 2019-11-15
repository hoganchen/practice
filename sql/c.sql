use stock;

-- select * from stock.hist_extend_week_data
--   where date = '2019-05-24' and volume < v_ma5 * 0.5 and close < ma60 and close > 10;

-- select code from (select hist_extend_day_data.code, (hist_extend_day_data.close * basics_data.totals) as total from hist_extend_day_data, basics_data where hist_extend_day_data.code = basics_data.code and hist_extend_day_data.date = '2019-05-29') as code_total where total > 100;;

select code, date, close, ma5, ma10, ma20, volume, v_ma5, v_ma10, v_ma20, (ma60 / close) as price_ratio from stock.hist_extend_day_data
  where code in (select code from (select hist_extend_day_data.code, (hist_extend_day_data.close * basics_data.totals) as total from hist_extend_day_data, basics_data
  where hist_extend_day_data.code = basics_data.code and hist_extend_day_data.date = '2019-05-29') as code_total where total > 100)
  and date = '2019-05-29' and volume < v_ma5 * 0.6 and close < ma60 and close > 10 and close > open * 1.01 order by price_ratio desc;
