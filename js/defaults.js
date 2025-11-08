// ==================== 默认数据配置 ====================

// 默认卡头配置
const defaultCardBins = [
    {
        id: 'bin1',
        prefix: "379240", 
        name: "美国运通",
        totalLength: 15,
        cvcLength: 4,
        enabled: true
    },
    {
        id: 'bin2',
        prefix: "552461",
        name: "Mastercard",
        totalLength: 16,
        cvcLength: 3,
        enabled: false
    },
    {
        id: 'bin3',
        prefix: "559888",
        name: "Mastercard Pro",
        totalLength: 16,
        cvcLength: 3,
        enabled: false
    }
];

// 默认个人信息配置
const defaultProfiles = [
    {
        id: 'profile1',
        name: '中国-北京',
        isActive: true,  // 标记为当前使用的配置
        data: {
            billingName: '张三',
            billingCountry: 'CN',
            billingPostalCode: '100000',
            billingAdministrativeArea: '北京市',
            billingLocality: '北京市',
            billingDependentLocality: '朝阳区',
            billingAddressLine1: '建国路123号'
        }
    },
    {
        id: 'profile2',
        name: '中国-上海',
        data: {
            billingName: '李四',
            billingCountry: 'CN',
            billingPostalCode: '200000',
            billingAdministrativeArea: '上海市',
            billingLocality: '上海市',
            billingDependentLocality: '浦东新区',
            billingAddressLine1: '世纪大道88号'
        }
    },
    {
        id: 'profile3',
        name: '中国-广州',
        data: {
            billingName: '王五',
            billingCountry: 'CN',
            billingPostalCode: '510000',
            billingAdministrativeArea: '广东省',
            billingLocality: '广州市',
            billingDependentLocality: '天河区',
            billingAddressLine1: '天河路888号'
        }
    },
    {
        id: 'profile4',
        name: '中国-深圳',
        data: {
            billingName: '赵六',
            billingCountry: 'CN',
            billingPostalCode: '518000',
            billingAdministrativeArea: '广东省',
            billingLocality: '深圳市',
            billingDependentLocality: '南山区',
            billingAddressLine1: '科技园南路666号'
        }
    },
    {
        id: 'profile5',
        name: '美国-纽约',
        data: {
            billingName: 'John Smith',
            billingCountry: 'US',
            billingPostalCode: '10001',
            billingAdministrativeArea: 'NY',
            billingLocality: 'New York',
            billingDependentLocality: 'Manhattan',
            billingAddressLine1: '123 Broadway Street'
        }
    },
    {
        id: 'profile6',
        name: '美国-加州',
        data: {
            billingName: 'Sarah Johnson',
            billingCountry: 'US',
            billingPostalCode: '90001',
            billingAdministrativeArea: 'CA',
            billingLocality: 'Los Angeles',
            billingDependentLocality: 'Downtown',
            billingAddressLine1: '456 Sunset Boulevard'
        }
    },
    {
        id: 'profile7',
        name: '英国-伦敦',
        data: {
            billingName: 'David Brown',
            billingCountry: 'GB',
            billingPostalCode: 'SW1A 1AA',
            billingAdministrativeArea: 'England',
            billingLocality: 'London',
            billingDependentLocality: 'Westminster',
            billingAddressLine1: '10 Downing Street'
        }
    },
    {
        id: 'profile8',
        name: '日本-东京',
        data: {
            billingName: 'Tanaka Yuki',
            billingCountry: 'JP',
            billingPostalCode: '100-0001',
            billingAdministrativeArea: '東京都',
            billingLocality: '千代田区',
            billingDependentLocality: '丸の内',
            billingAddressLine1: '丸の内1-1-1'
        }
    },
    {
        id: 'profile9',
        name: '澳大利亚-悉尼',
        data: {
            billingName: 'Michael Wilson',
            billingCountry: 'AU',
            billingPostalCode: '2000',
            billingAdministrativeArea: 'NSW',
            billingLocality: 'Sydney',
            billingDependentLocality: 'City Center',
            billingAddressLine1: '123 George Street'
        }
    },
    {
        id: 'profile10',
        name: '加拿大-多伦多',
        data: {
            billingName: 'Emily Taylor',
            billingCountry: 'CA',
            billingPostalCode: 'M5H 2N2',
            billingAdministrativeArea: 'ON',
            billingLocality: 'Toronto',
            billingDependentLocality: 'Downtown',
            billingAddressLine1: '100 King Street West'
        }
    },
    {
        id: 'profile11',
        name: '新加坡',
        data: {
            billingName: 'Lee Wei Ming',
            billingCountry: 'SG',
            billingPostalCode: '018956',
            billingAdministrativeArea: 'Singapore',
            billingLocality: 'Singapore',
            billingDependentLocality: 'Central',
            billingAddressLine1: '1 Marina Boulevard'
        }
    },
    {
        id: 'profile12',
        name: '德国-柏林',
        data: {
            billingName: 'Hans Mueller',
            billingCountry: 'DE',
            billingPostalCode: '10115',
            billingAdministrativeArea: 'Berlin',
            billingLocality: 'Berlin',
            billingDependentLocality: 'Mitte',
            billingAddressLine1: 'Unter den Linden 77'
        }
    }
];

