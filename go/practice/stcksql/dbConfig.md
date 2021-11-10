# Go Mysql Configuration

### <li> 创建数据库
```mysql
-- 创建数据库
create database gostock default character set=utf8;
create user gostck identified by 'stck&sql';
grant all on gostock.* to gostck;
```

### <li> 精简Stock数据库表(无自增id，删除sina相关的表，update date: 2021-11-08)
```mysql
create table code_data
(
  code char(6) not null,
  name varchar(8) not null,
  primary key (code)
) engine=innodb default charset=utf8;


create table em_code_data
(
  code char(6) not null,
  name varchar(8) not null,
  primary key (code)
) engine=innodb default charset=utf8;


create table basics_data
(
  date date not null,
  code char(6) not null,
  name varchar(8) not null,
  industry varchar(6) default "",
  area varchar(4) default "",
  timeToMarket int not null,
  pe float not null,
  pb float not null,
  roe float not null,
  esp float not null,
  bvps float not null,
  outstanding float not null,
  totals float not null,
  marketCap float not null,
  totalMarketCap float not null,
  totalAssets float not null,
  liquidAssets float not null,
  fixedAssets float not null,
  revenue float not null,
  revenueRatio float not null,
  profit float not null,
  profitRatio float not null,
  undp float not null,
  perundp float not null,
  gpr float not null,
  npr float not null,
  reserved float not null,
  reservedPerShare float not null,
  totalLiability float not null,
  currentLiability float not null,
  debtAssetRatio float not null,
  shareholdersEquity float not null,
  primary key (code)
) engine=innodb default charset=utf8;


create table basics_all_data
(
  date date not null,
  code char(6) not null,
  name varchar(8) not null,
  price float not null,
  p_change float not null,
  volume float not null,
  amount float not null,
  industry varchar(6) default "",
  area varchar(4) default "",
  timeToMarket int not null,
  static_pe float not null,
  dynamic_pe float not null,
  rolling_pe float not null,
  pb float not null,
  roe float not null,
  esp float not null,
  bvps float not null,
  per_holdings float not null,
  outstanding float not null,
  totals float not null,
  marketCap float not null,
  totalMarketCap float not null,
  totalAssets float not null,
  liquidAssets float not null,
  fixedAssets float not null,
  intangibleAssets float not null,
  revenue float not null,
  revenueRatio float not null,
  profit float not null,
  profitRatio float not null,
  undp float not null,
  perundp float not null,
  gpr float not null,
  npr float not null,
  reserved float not null,
  reservedPerShare float not null,
  totalLiability float not null,
  currentLiability float not null,
  noncurrentLiability float not null,
  debtAssetRatio float not null,
  shareholdersEquity float not null,
  equityRatio float not null,
  5days_p_change float not null,
  10days_p_change float not null,
  20days_p_change float not null,
  60days_p_change float not null,
  year_p_change float not null,
  52weeks_low float not null,
  52weeks_high float not null,
  primary key (code)
) engine=innodb default charset=utf8;


create table basics_industry_data
(
  BOARD_CODE char(6) not null,
  BOARD_NAME varchar(6) not null,
  FREE_SHARES_VAG float not null,
  LOSS_COUNT int not null,
  MARKET_CAP_VAG float not null,
  NOMARKETCAP_A_VAG float not null,
  NOTLIMITED_MARKETCAP_A float not null,
  NUM int not null,
  ORIGINALCODE char(8) not null,
  PB_MRQ float not null,
  PCF_OCF_TTM float not null,
  PEG_CAR float not null,
  PE_LAR float not null,
  PE_TTM float not null,
  PS_TTM float not null,
  TOTAL_MARKET_CAP float not null,
  TOTAL_SHARES bigint not null,
  TOTAL_SHARES_VAG float not null,
  primary key (ORIGINALCODE)
) engine=innodb default charset=utf8;


create table basics_stock_data
(
  BOARD_CODE char(6) not null,
  BOARD_NAME varchar(6) not null,
  CHANGE_RATE float not null,
  CLOSE_PRICE float not null,
  FREE_SHARES_A bigint not null,
  NOTLIMITED_MARKETCAP_A float not null,
  ORG_CODE char(16) not null,
  ORIG_BOARD_CODE char(8) not null,
  PB_MRQ float not null,
  PCF_OCF_LAR float not null,
  PCF_OCF_TTM float not null,
  PEG_CAR float not null,
  PE_LAR float not null,
  PE_TTM float not null,
  PS_TTM float not null,
  SECURITY_CODE char(6) not null,
  SECURITY_NAME_ABBR varchar(8) not null,
  TOTAL_MARKET_CAP float not null,
  TOTAL_SHARES bigint not null,
  primary key (SECURITY_CODE)
) engine=innodb default charset=utf8;


create table em_concept_data
(
  code char(6) not null,
  name varchar(8) not null,
  pb float not null,
  ttm float not null,
  classifiedCode char(6) not null,
  classifiedName varchar(10) not null
) engine=innodb default charset=utf8;


create table em_area_data
(
  code char(6) not null,
  name varchar(8) not null,
  pb float not null,
  ttm float not null,
  classifiedCode char(6) not null,
  classifiedName varchar(5) not null
) engine=innodb default charset=utf8;


create table em_industry_data like em_area_data;


create table em_annual_data
(
  BLDKBBL float not null,
  BPS float not null,
  BPSTZ float not null,
  CHZZL float not null,
  CHZZTS float not null,
  COMPENSATE_EXPENSE float not null,

  CQBL float not null,
  EARNED_PREMIUM float not null,
  EPSJB float not null,
  EPSJBTZ float not null,
  EPSKCJB float not null,

  EPSXS float not null,
  GROSSLOANS float not null,
  HXYJBCZL float not null,
  JJYWFXZB float not null,
  JYXJLYYSR float not null,
  JZB float not null,

  JZBJZC float not null,
  JZC float not null,
  KCFJCXSYJLR float not null,
  KCFJCXSYJLRTZ float not null,
  KFJLRGDHBZC float not null,
  LD float not null,

  LTDRR float not null,
  MGJYXJJE float not null,
  MGJYXJJETZ float not null,
  MGWFPLR float not null,
  MGWFPLRTZ float not null,
  MGZBGJ float not null,

  MGZBGJTZ float not null,
  MLR float not null,
  NBV_LIFE float not null,
  NBV_RATE float not null,
  NETPROFITRPHBZC float not null,
  NET_ROI float not null,

  NEWCAPITALADER float not null,
  NHJZ_CURRENT_AMT float not null,
  NONPERLOAN float not null,

  NZBJE float not null,
  ORG_CODE float not null,
  PARENTNETPROFIT float not null,
  PARENTNETPROFITTZ float not null,

  QYCS float not null,
  REPORT_DATE date not null,

  ROEJQ float not null,
  ROEJQTZ float not null,
  ROEKCJQ float not null,
  ROIC float not null,
  ROICTZ float not null,
  RZRQYWFXZB float not null,
  SD float not null,

  SECURITY_CODE char(6) not null,
  SECURITY_TYPE_CODE char(9) not null,

  SOLVENCY_AR float not null,
  SURRENDER_RATE_LIFE float not null,
  TAXRATE float not null,
  TOAZZL float not null,

  TOTALDEPOSITS float not null,
  TOTALOPERATEREVE float not null,
  TOTALOPERATEREVETZ float not null,
  TOTAL_ROI float not null,

  XJLLB float not null,
  XSJLL float not null,
  XSJXLYYSR float not null,
  XSMLL float not null,
  YSZKYYSR float not null,

  YSZKZZL float not null,
  YSZKZZTS float not null,
  YYFXZB float not null,
  YYZSRGDHBZC float not null,
  ZCFZL float not null,
  ZCFZLTZ float not null,

  ZQCXYWFXZB float not null,
  ZQZYYWFXZB float not null,
  ZYGDSYLZQJZB float not null,
  ZYGPGMJZC float not null,
  ZZCJLL float not null,

  ZZCJLLTZ float not null,
  ZZCZZTS float not null,
  primary key (SECURITY_CODE, REPORT_DATE),
  index idx_date (REPORT_DATE)
) engine=innodb default charset=utf8;


create table etf_data
(
  date date not null,
  code char(6) not null,
  market char(1) not null,
  name varchar(16) not null,
  primary key (code)
) engine=innodb default charset=utf8;


create table etf_qfq_day_data
(
  date date not null,
  code char(6) not null,
  open float not null,
  close float not null,
  high float not null,
  low float not null,
  volume bigint not null,
  amount float not null,
  primary key (code, date),
  index idx_date (date)
) engine=innodb default charset=utf8;


create table etf_qfq_week_data like etf_qfq_day_data;
create table etf_qfq_month_data like etf_qfq_day_data;


create table etf_qfq_day_extend_data
(
  date date not null,
  code char(6) not null,
  open float not null,
  close float not null,
  high float not null,
  low float not null,
  volume bigint not null,
  amount float not null,
  p_change float not null,
  price_change float not null,
  ma5 float not null,
  ma10 float not null,
  ma20 float not null,
  ma30 float not null,
  ma60 float not null,
  ma120 float not null,
  ma240 float not null,
  v_ma5 float not null,
  v_ma10 float not null,
  v_ma20 float not null,
  v_ma30 float not null,
  v_ma60 float not null,
  v_ma120 float not null,
  v_ma240 float not null,
  high5 float not null,
  high10 float not null,
  high20 float not null,
  high30 float not null,
  high60 float not null,
  high120 float not null,
  high240 float not null,
  low5 float not null,
  low10 float not null,
  low20 float not null,
  low30 float not null,
  low60 float not null,
  low120 float not null,
  low240 float not null,
  primary key (code, date),
  index idx_date (date)
) engine=innodb default charset=utf8;


create table etf_qfq_week_extend_data like etf_qfq_day_extend_data;
create table etf_qfq_month_extend_data like etf_qfq_day_extend_data;


create table k_qfq_day_data
(
  date date not null,
  code char(6) not null,
  open float not null,
  close float not null,
  high float not null,
  low float not null,
  volume bigint not null,
  amount float not null,
  primary key (code, date),
  index idx_date (date)
) engine=innodb default charset=utf8;


create table k_qfq_week_data like k_qfq_day_data;
create table k_qfq_month_data like k_qfq_day_data;


create table k_qfq_day_extend_data
(
  date date not null,
  code char(6) not null,
  open float not null,
  close float not null,
  high float not null,
  low float not null,
  volume bigint not null,
  amount float not null,
  p_change float not null,
  price_change float not null,
  ma5 float not null,
  ma10 float not null,
  ma20 float not null,
  ma30 float not null,
  ma60 float not null,
  ma120 float not null,
  ma240 float not null,
  v_ma5 float not null,
  v_ma10 float not null,
  v_ma20 float not null,
  v_ma30 float not null,
  v_ma60 float not null,
  v_ma120 float not null,
  v_ma240 float not null,
  high5 float not null,
  high10 float not null,
  high20 float not null,
  high30 float not null,
  high60 float not null,
  high120 float not null,
  high240 float not null,
  low5 float not null,
  low10 float not null,
  low20 float not null,
  low30 float not null,
  low60 float not null,
  low120 float not null,
  low240 float not null,
  primary key (code, date),
  index idx_date (date)
) engine=innodb default charset=utf8;


create table k_qfq_week_extend_data like k_qfq_day_extend_data;
create table k_qfq_month_extend_data like k_qfq_day_extend_data;


create table update_status_data
(
  name varchar(32) not null,
  date date not null,
  primary key (name)
) engine=innodb default charset=utf8;
```