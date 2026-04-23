/**
 * 运动耗热估算：基于 **MET**（Metabolic Equivalent of Task，代谢当量，静息代谢的倍数）。
 * 常见公式：消耗大卡 ≈ `MET × 体重(kg) × 时长(小时)`。
 *
 * 数据参考 Compendium of Physical Activities 等公开资料中的典型 MET；**同一运动不同强度下 MET 不同**，
 * 本库将常见强度拆成多条，便于选「与本人相符」的一项，而非穷尽人体每一种动作变体。
 *
 * 若需未收录项目，可近似选强度最接近的一条，或把「自定义」与 MET 自填留作后续扩展。
 */

export type ExerciseEntryDef = {
  id: string;
  /** 中文展示名，含常见强度/场景说明 */
  name: string;
  /** 代谢当量（MET，约 1 MET ≈ 1 kcal·kg⁻¹·h⁻¹） */
  met: number;
  /** 分类，用于成组选择 */
  category: string;
};

export const EXERCISE_CATEGORIES: string[] = [
  "步行与日常活动",
  "跑步",
  "骑行",
  "游泳与水上",
  "球类与对抗",
  "健身房与力量",
  "有氧与操课",
  "舞蹈",
  "武术与格斗",
  "冬季与滑行",
  "户外与登山",
  "瑜伽与拉伸",
  "家务、工作与休闲",
  "其他与康复",
];

/** 公制、典型休闲与运动方式（按 MET 分档，覆盖日常能遇到的大部分选择） */
export const EXERCISE_CATALOG: ExerciseEntryDef[] = [
  // 步行与日常
  { id: "d001", name: "静坐（办公、看电视）", met: 1.3, category: "步行与日常活动" },
  { id: "d002", name: "站立（轻度活动）", met: 1.8, category: "步行与日常活动" },
  { id: "d003", name: "慢走（约 2.7 km/h）", met: 2.3, category: "步行与日常活动" },
  { id: "d004", name: "常速走（约 4.8 km/h）", met: 3.3, category: "步行与日常活动" },
  { id: "d005", name: "快走（约 5.5–6.5 km/h）", met: 4.3, category: "步行与日常活动" },
  { id: "d006", name: "很快走/竞走感（约 7 km/h+）", met: 5.0, category: "步行与日常活动" },
  { id: "d007", name: "上楼梯（一般速度）", met: 4.0, category: "步行与日常活动" },
  { id: "d008", name: "下楼梯", met: 3.0, category: "步行与日常活动" },
  { id: "d009", name: "抱小孩走动", met: 2.5, category: "步行与日常活动" },
  { id: "d010", name: "遛狗（常速走）", met: 3.0, category: "步行与日常活动" },
  { id: "d011", name: "推婴儿车步行", met: 2.5, category: "步行与日常活动" },
  { id: "d012", name: "倒走", met: 3.0, category: "步行与日常活动" },
  { id: "d013", name: "持杖健走（Nordic walking，中等）", met: 4.5, category: "步行与日常活动" },
  // 跑步
  { id: "r001", name: "跑步机上慢跑（约 6.5 km/h）", met: 6.0, category: "跑步" },
  { id: "r002", name: "慢跑（约 8 km/h）", met: 8.0, category: "跑步" },
  { id: "r003", name: "中速跑（约 9.5 km/h）", met: 9.8, category: "跑步" },
  { id: "r004", name: "较快跑（约 11 km/h）", met: 11.0, category: "跑步" },
  { id: "r005", name: "间歇跑/节奏跑（中高强度）", met: 10.0, category: "跑步" },
  { id: "r006", name: "越野跑/起伏路面", met: 9.0, category: "跑步" },
  { id: "r007", name: "跑楼梯（上）", met: 8.0, category: "跑步" },
  { id: "r008", name: "跑步机爬坡跑（中等）", met: 9.0, category: "跑步" },
  { id: "r009", name: "短跑/冲刺感（约 12 km/h+）", met: 12.0, category: "跑步" },
  { id: "r010", name: "原地慢跑", met: 5.5, category: "跑步" },
  // 骑行
  { id: "c001", name: "自行车休闲骑（<16 km/h，平地）", met: 4.0, category: "骑行" },
  { id: "c002", name: "自行车中速（约 19–22 km/h）", met: 6.0, category: "骑行" },
  { id: "c003", name: "自行车较快（约 22–25 km/h）", met: 8.0, category: "骑行" },
  { id: "c004", name: "自行车竞速/爬坡（重强度）", met: 10.0, category: "骑行" },
  { id: "c005", name: "室内动感单车（中等强度）", met: 6.0, category: "骑行" },
  { id: "c006", name: "室内动感单车（高强度）", met: 8.5, category: "骑行" },
  { id: "c007", name: "E-bike 助力骑行（低负荷）", met: 3.5, category: "骑行" },
  { id: "c008", name: "BMX/技巧车（中高强度）", met: 5.0, category: "骑行" },
  { id: "c009", name: "骑固定自行车（台训，中）", met: 6.0, category: "骑行" },
  { id: "c010", name: "骑固定自行车（台训，高）", met: 8.0, category: "骑行" },
  // 游泳
  { id: "s001", name: "游泳：休闲慢游", met: 4.0, category: "游泳与水上" },
  { id: "s002", name: "游泳：自由式（中等）", met: 8.0, category: "游泳与水上" },
  { id: "s003", name: "游泳：自由式（用力）", met: 9.0, category: "游泳与水上" },
  { id: "s004", name: "游泳：蛙式", met: 5.0, category: "游泳与水上" },
  { id: "s005", name: "游泳：仰式", met: 4.0, category: "游泳与水上" },
  { id: "s006", name: "游泳：蝶式", met: 8.0, category: "游泳与水上" },
  { id: "s007", name: "水中有氧操", met: 3.0, category: "游泳与水上" },
  { id: "s008", name: "水球", met: 8.0, category: "游泳与水上" },
  { id: "s009", name: "划龙舟（队训强度中等）", met: 6.0, category: "游泳与水上" },
  { id: "s010", name: "皮划艇/桨板（休闲）", met: 3.0, category: "游泳与水上" },
  { id: "s011", name: "皮划艇（中高强度）", met: 5.0, category: "游泳与水上" },
  { id: "s012", name: "冲浪", met: 3.0, category: "游泳与水上" },
  { id: "s013", name: "潜水（休闲）", met: 3.0, category: "游泳与水上" },
  // 球类
  { id: "b001", name: "篮球：一般比赛/半场", met: 5.0, category: "球类与对抗" },
  { id: "b002", name: "篮球：全场激烈", met: 6.0, category: "球类与对抗" },
  { id: "b003", name: "足球：一般比赛", met: 5.0, category: "球类与对抗" },
  { id: "b004", name: "足球：激烈", met: 6.0, category: "球类与对抗" },
  { id: "b005", name: "网球：休闲对打", met: 4.0, category: "球类与对抗" },
  { id: "b006", name: "网球：单打（认真）", met: 5.0, category: "球类与对抗" },
  { id: "b007", name: "羽毛球：休闲", met: 4.0, category: "球类与对抗" },
  { id: "b008", name: "羽毛球：单打（认真）", met: 5.0, category: "球类与对抗" },
  { id: "b009", name: "乒乓球", met: 3.0, category: "球类与对抗" },
  { id: "b010", name: "排球：一般", met: 3.0, category: "球类与对抗" },
  { id: "b011", name: "排球：比赛", met: 4.0, category: "球类与对抗" },
  { id: "b012", name: "棒球/垒球", met: 3.0, category: "球类与对抗" },
  { id: "b013", name: "高尔夫球：步行携带球具", met: 3.0, category: "球类与对抗" },
  { id: "b014", name: "壁球/回力球", met: 5.0, category: "球类与对抗" },
  { id: "b015", name: "手球", met: 5.0, category: "球类与对抗" },
  { id: "b016", name: "板球/棒垒训练", met: 3.0, category: "球类与对抗" },
  { id: "b017", name: "毽球", met: 3.0, category: "球类与对抗" },
  { id: "b018", name: "腰旗橄榄球/触式橄榄球", met: 5.0, category: "球类与对抗" },
  { id: "b019", name: "地掷球/门球", met: 2.0, category: "球类与对抗" },
  { id: "b020", name: "曲棍球/草地曲棍", met: 5.0, category: "球类与对抗" },
  { id: "b021", name: "长曲棍球", met: 5.0, category: "球类与对抗" },
  { id: "b022", name: "保龄球", met: 2.0, category: "球类与对抗" },
  { id: "b023", name: "台球/斯诺克", met: 2.0, category: "球类与对抗" },
  // 健身房
  { id: "g001", name: "力量训练：全身/器械（中）", met: 3.0, category: "健身房与力量" },
  { id: "g002", name: "力量训练：全身/自由重量（中高强度）", met: 3.0, category: "健身房与力量" },
  { id: "g003", name: "卧推/推举（组间休息）", met: 2.0, category: "健身房与力量" },
  { id: "g004", name: "深蹲/硬拉（中高强度组训）", met: 3.0, category: "健身房与力量" },
  { id: "g005", name: "高位下拉/坐姿划船等", met: 2.0, category: "健身房与力量" },
  { id: "g006", name: "战绳", met: 5.0, category: "健身房与力量" },
  { id: "g007", name: "壶铃摇摆", met: 4.0, category: "健身房与力量" },
  { id: "g008", name: "药球训练", met: 3.0, category: "健身房与力量" },
  { id: "g009", name: "CrossFit/综合体能（课）", met: 5.0, category: "健身房与力量" },
  { id: "g010", name: "功能性训练/私教课（中）", met: 3.0, category: "健身房与力量" },
  { id: "g011", name: "引体/双杠/自重循环", met: 3.0, category: "健身房与力量" },
  { id: "g012", name: "史密斯机训练", met: 2.0, category: "健身房与力量" },
  // 有氧
  { id: "a001", name: "椭圆机（中等）", met: 5.0, category: "有氧与操课" },
  { id: "a002", name: "椭圆机（较高强度）", met: 6.0, category: "有氧与操课" },
  { id: "a003", name: "划船机", met: 5.0, category: "有氧与操课" },
  { id: "a004", name: "爬楼机/踏步机", met: 5.0, category: "有氧与操课" },
  { id: "a005", name: "有氧操：低冲击", met: 4.0, category: "有氧与操课" },
  { id: "a006", name: "有氧操：高冲击", met: 6.0, category: "有氧与操课" },
  { id: "a007", name: "健身操/踏板操", met: 4.0, category: "有氧与操课" },
  { id: "a008", name: "搏击操（BodyCombat 类）", met: 6.0, category: "有氧与操课" },
  { id: "a009", name: "尊巴（Zumba，中等）", met: 4.0, category: "有氧与操课" },
  { id: "a010", name: "尊巴（较高强度）", met: 5.0, category: "有氧与操课" },
  { id: "a011", name: "HIIT/高强度间歇", met: 6.0, category: "有氧与操课" },
  { id: "a012", name: "跳绳（中等）", met: 8.0, category: "有氧与操课" },
  { id: "a013", name: "跳绳（快）", met: 9.0, category: "有氧与操课" },
  { id: "a014", name: "波比跳/循环体能", met: 5.0, category: "有氧与操课" },
  { id: "a015", name: "开合跳/徒手有氧", met: 4.0, category: "有氧与操课" },
  { id: "a016", name: "踏步/健身操课（团课）", met: 4.0, category: "有氧与操课" },
  { id: "a017", name: "健腹轮/轮训小工具", met: 2.0, category: "有氧与操课" },
  { id: "a018", name: "战绳+心肺循环", met: 5.0, category: "有氧与操课" },
  { id: "a019", name: "楼梯冲刺/间歇上台阶", met: 5.0, category: "有氧与操课" },
  { id: "a020", name: "体适能机（Arc Trainer 等，中）", met: 5.0, category: "有氧与操课" },
  { id: "a021", name: "滑雪机/风阻划船组合", met: 5.0, category: "有氧与操课" },
  // 舞蹈
  { id: "f001", name: "芭蕾/形体（课堂）", met: 3.0, category: "舞蹈" },
  { id: "f002", name: "爵士舞", met: 4.0, category: "舞蹈" },
  { id: "f003", name: "街舞（中等）", met: 4.0, category: "舞蹈" },
  { id: "f004", name: "街舞（激烈）", met: 5.0, category: "舞蹈" },
  { id: "f005", name: "拉丁/萨尔萨", met: 4.0, category: "舞蹈" },
  { id: "f006", name: "交谊舞/华尔兹（慢）", met: 2.0, category: "舞蹈" },
  { id: "f007", name: "广场舞（中等）", met: 3.0, category: "舞蹈" },
  { id: "f008", name: "排舞/集体舞", met: 3.0, category: "舞蹈" },
  { id: "f009", name: "民族舞/古典舞", met: 3.0, category: "舞蹈" },
  { id: "f010", name: "现代舞/当代舞", met: 3.0, category: "舞蹈" },
  { id: "f011", name: "钢管舞/空中吊环（训练课）", met: 3.0, category: "舞蹈" },
  { id: "f012", name: "啦啦操", met: 3.0, category: "舞蹈" },
  { id: "f013", name: "K-pop 舞蹈跟练", met: 3.0, category: "舞蹈" },
  { id: "f014", name: "莎莎/巴恰塔（中强度）", met: 3.0, category: "舞蹈" },
  { id: "f015", name: "黑怕齐舞排演", met: 3.0, category: "舞蹈" },
  // 武术
  { id: "m001", name: "太极拳：传统慢练", met: 2.0, category: "武术与格斗" },
  { id: "m002", name: "太极拳：竞赛/快架", met: 3.0, category: "武术与格斗" },
  { id: "m003", name: "八段锦/易筋经（导引）", met: 1.0, category: "武术与格斗" },
  { id: "m004", name: "武术套路训练（一般）", met: 3.0, category: "武术与格斗" },
  { id: "m005", name: "散手/对练（中等）", met: 4.0, category: "武术与格斗" },
  { id: "m006", name: "柔道/摔跤", met: 4.0, category: "武术与格斗" },
  { id: "m007", name: "跆拳道：对打/对练", met: 5.0, category: "武术与格斗" },
  { id: "m008", name: "跆拳道：品势/踢靶", met: 3.0, category: "武术与格斗" },
  { id: "m009", name: "拳击：沙袋/空击", met: 4.0, category: "武术与格斗" },
  { id: "m010", name: "拳击：对练/实战", met: 5.0, category: "武术与格斗" },
  { id: "m011", name: "泰拳/踢拳", met: 4.0, category: "武术与格斗" },
  { id: "m012", name: "巴西柔术/地面缠斗", met: 4.0, category: "武术与格斗" },
  { id: "m013", name: "MMA/综合格斗训练", met: 4.0, category: "武术与格斗" },
  { id: "m014", name: "击剑", met: 3.0, category: "武术与格斗" },
  { id: "m015", name: "剑道/兵道", met: 3.0, category: "武术与格斗" },
  // 冬季
  { id: "w001", name: "滑雪：双板休闲", met: 3.0, category: "冬季与滑行" },
  { id: "w002", name: "滑雪：双板中高级", met: 4.0, category: "冬季与滑行" },
  { id: "w003", name: "滑雪：单板", met: 3.0, category: "冬季与滑行" },
  { id: "w004", name: "滑冰：休闲", met: 3.0, category: "冬季与滑行" },
  { id: "w005", name: "冰球：一般比赛", met: 4.0, category: "冬季与滑行" },
  { id: "w006", name: "冰壶", met: 2.0, category: "冬季与滑行" },
  { id: "w007", name: "雪橇/雪地徒步", met: 3.0, category: "冬季与滑行" },
  { id: "w008", name: "雪鞋行走", met: 3.0, category: "冬季与滑行" },
  { id: "w009", name: "轮滑/旱冰：休闲", met: 3.0, category: "冬季与滑行" },
  { id: "w010", name: "轮滑/旱冰：速滑感", met: 4.0, category: "冬季与滑行" },
  { id: "w011", name: "长板/滑浪板（巡航）", met: 2.0, category: "冬季与滑行" },
  { id: "w012", name: "滑板：公园/技巧", met: 3.0, category: "冬季与滑行" },
  { id: "w013", name: "雪地摩托（非驾驶仅为步行辅助）", met: 1.0, category: "冬季与滑行" },
  { id: "w014", name: "滑草/草上滑行", met: 3.0, category: "冬季与滑行" },
  // 户外
  { id: "o001", name: "徒步：平地轻载", met: 3.0, category: "户外与登山" },
  { id: "o002", name: "徒步：爬坡/负重", met: 5.0, category: "户外与登山" },
  { id: "o003", name: "登山/越野徒步（中强度）", met: 4.0, category: "户外与登山" },
  { id: "o004", name: "越野跑/山径跑", met: 5.0, category: "户外与登山" },
  { id: "o005", name: "攀岩：室内顶绳/抱石", met: 3.0, category: "户外与登山" },
  { id: "o006", name: "攀岩：户外多段", met: 4.0, category: "户外与登山" },
  { id: "o007", name: "速降/溪降（中强度）", met: 3.0, category: "户外与登山" },
  { id: "o008", name: "定向越野跑", met: 5.0, category: "户外与登山" },
  { id: "o009", name: "飞盘：休闲", met: 2.0, category: "户外与登山" },
  { id: "o010", name: "飞盘：极限飞盘/比赛", met: 3.0, category: "户外与登山" },
  { id: "o011", name: "钓鱼：站立/走动", met: 1.0, category: "户外与登山" },
  { id: "o012", name: "射箭", met: 2.0, category: "户外与登山" },
  { id: "o013", name: "户外拓展/绳索课程", met: 2.0, category: "户外与登山" },
  { id: "o014", name: "露营搭建/轻体力", met: 2.0, category: "户外与登山" },
  { id: "o015", name: "越野摩托（骑行/站立控车）", met: 1.0, category: "户外与登山" },
  { id: "o016", name: "滑翔伞/翼装（非飞行操作仅地面准备）", met: 1.0, category: "户外与登山" },
  { id: "o017", name: "桨板/皮艇越野", met: 3.0, category: "户外与登山" },
  { id: "o018", name: "沙滩排球", met: 3.0, category: "户外与登山" },
  // 瑜伽
  { id: "y001", name: "瑜伽：哈他/慢流动", met: 2.0, category: "瑜伽与拉伸" },
  { id: "y002", name: "瑜伽：力量/流瑜伽（Vinyasa，中）", met: 3.0, category: "瑜伽与拉伸" },
  { id: "y003", name: "瑜伽：高温瑜伽", met: 2.0, category: "瑜伽与拉伸" },
  { id: "y004", name: "普拉提：垫上", met: 2.0, category: "瑜伽与拉伸" },
  { id: "y005", name: "普拉提：大器械", met: 2.0, category: "瑜伽与拉伸" },
  { id: "y006", name: "拉伸/筋膜放松课", met: 1.0, category: "瑜伽与拉伸" },
  { id: "y007", name: "泡沫轴放松", met: 1.0, category: "瑜伽与拉伸" },
  { id: "y008", name: "阴瑜伽/恢复性", met: 1.0, category: "瑜伽与拉伸" },
  { id: "y009", name: "阴瑜伽+呼吸", met: 1.0, category: "瑜伽与拉伸" },
  { id: "y010", name: "Barre/芭蕾把杆形体", met: 3.0, category: "瑜伽与拉伸" },
  { id: "y011", name: "正念行走/动中禅（慢）", met: 1.0, category: "瑜伽与拉伸" },
  // 家务
  { id: "h001", name: "扫地/吸尘", met: 2.0, category: "家务、工作与休闲" },
  { id: "h002", name: "拖地/擦地", met: 2.0, category: "家务、工作与休闲" },
  { id: "h003", name: "手洗衣物", met: 1.0, category: "家务、工作与休闲" },
  { id: "h004", name: "搬家具/重物", met: 3.0, category: "家务、工作与休闲" },
  { id: "h005", name: "搬纸箱（中强度）", met: 2.0, category: "家务、工作与休闲" },
  { id: "h006", name: "园艺：除草/种花", met: 2.0, category: "家务、工作与休闲" },
  { id: "h007", name: "割草机推剪", met: 3.0, category: "家务、工作与休闲" },
  { id: "h008", name: "刷墙/小装修", met: 2.0, category: "家务、工作与休闲" },
  { id: "h009", name: "陪儿童玩耍：轻度追逐", met: 2.0, category: "家务、工作与休闲" },
  { id: "h010", name: "逛街购物（常速走）", met: 2.0, category: "家务、工作与休闲" },
  { id: "h011", name: "办公室走动", met: 1.0, category: "家务、工作与休闲" },
  { id: "h012", name: "电子游戏：体感/健身环类", met: 2.0, category: "家务、工作与休闲" },
  { id: "h013", name: "扑克/桌游（静坐）", met: 1.0, category: "家务、工作与休闲" },
  { id: "h014", name: "唱歌（站立 K 歌）", met: 1.0, category: "家务、工作与休闲" },
  { id: "h015", name: "演奏乐器：吉他站立", met: 1.0, category: "家务、工作与休闲" },
  { id: "h016", name: "驾驶汽车（仅操作，几乎不计）", met: 0.0, category: "家务、工作与休闲" },
  { id: "h017", name: "站立办公", met: 1.0, category: "家务、工作与休闲" },
  { id: "h018", name: "整理收纳（走动）", met: 1.0, category: "家务、工作与休闲" },
  { id: "h019", name: "厨房备餐（站立）", met: 1.0, category: "家务、工作与休闲" },
  { id: "h020", name: "遛狗快跑阶段", met: 3.0, category: "家务、工作与休闲" },
  { id: "h021", name: "亲子游戏：举高高/追逐", met: 2.0, category: "家务、工作与休闲" },
  { id: "h022", name: "跳绳（家中小场地）", met: 5.0, category: "家务、工作与休闲" },
  // 其他/康复
  { id: "e001", name: "慢速康复走", met: 1.0, category: "其他与康复" },
  { id: "e002", name: "水中步行/康复泳", met: 1.0, category: "其他与康复" },
  { id: "e003", name: "固定自行车：康复低负荷", met: 1.0, category: "其他与康复" },
  { id: "e004", name: "呼吸训练/伸展（术后，极轻量）", met: 0.0, category: "其他与康复" },
  { id: "e005", name: "冷身整理/收操", met: 1.0, category: "其他与康复" },
  { id: "e006", name: "热身/动态拉伸（课前）", met: 1.0, category: "其他与康复" },
  { id: "e007", name: "泡沫轴课（团课）", met: 1.0, category: "其他与康复" },
  { id: "e008", name: "姿势矫正/PT 带练", met: 1.0, category: "其他与康复" },
  { id: "e009", name: "慢跑恢复跑（轻松）", met: 3.0, category: "其他与康复" },
  { id: "e010", name: "睡眠（不计入活动消耗，MET 参考 0.9）", met: 0.0, category: "其他与康复" },
];

/** 用于「本日运动」选项目：已过滤 MET≤0 的项（如驾驶、睡眠、纯静坐参考） */
export const EXERCISES_FOR_DAILY_LOG: ExerciseEntryDef[] = EXERCISE_CATALOG.filter(
  (e) => e.met > 0,
);

const catalogById = new Map(
  EXERCISE_CATALOG.map((e) => [e.id, e] as const),
);

/** 无体重时用于估算的默认体重（kg） */
export const DEFAULT_WEIGHT_KG_FOR_BURN = 70;

/**
 * 由 MET 与体重、时长估算消耗大卡（kcal）。
 * `met <= 0` 时按 0 计（避免驾驶等极低或无效项被误用）。
 */
export function kcalFromMet(
  met: number,
  weightKg: number,
  minutes: number,
): number {
  if (met <= 0 || !Number.isFinite(met) || !Number.isFinite(weightKg) || !Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }
  return Math.round(met * weightKg * (minutes / 60) * 10) / 10;
}

export function getExerciseById(id: string): ExerciseEntryDef | undefined {
  return catalogById.get(id);
}

export function exercisesInCategory(category: string): ExerciseEntryDef[] {
  return EXERCISES_FOR_DAILY_LOG.filter((e) => e.category === category);
}

/** 按名称子串模糊搜索（不区分大小写，中文直接包含） */
export function searchExercises(keyword: string, limit = 30): ExerciseEntryDef[] {
  const q = keyword.trim().toLowerCase();
  if (!q) {
    return EXERCISES_FOR_DAILY_LOG.slice(0, limit);
  }
  return EXERCISES_FOR_DAILY_LOG.filter((e) =>
    e.name.toLowerCase().includes(q),
  ).slice(0, limit);
}

export function ymdInBeijing(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}
