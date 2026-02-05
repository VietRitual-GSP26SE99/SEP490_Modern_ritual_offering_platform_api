import React, { useState } from 'react';

interface SystemSettingsProps {
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

interface SystemConfig {
  id: string;
  category: 'general' | 'payment' | 'delivery' | 'notification';
  name: string;
  value: string | boolean | number;
  description: string;
  editable: boolean;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ onNavigate, onLogout }) => {
  const [activeCategory, setActiveCategory] = useState<'general' | 'payment' | 'delivery' | 'notification'>('general');
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);

  const [configs, setConfigs] = useState<SystemConfig[]>([
    // General Settings
    {
      id: 'GEN-001',
      category: 'general',
      name: 'Tên hệ thống',
      value: 'Modern Ritual',
      description: 'Tên hiển thị của nền tảng',
      editable: true
    },
    {
      id: 'GEN-002',
      category: 'general',
      name: 'Email hỗ trợ',
      value: 'support@modernritual.com',
      description: 'Email chính để khách hàng liên hệ',
      editable: true
    },
    {
      id: 'GEN-003',
      category: 'general',
      name: 'Hotline',
      value: '1900-xxxx',
      description: 'Số điện thoại hỗ trợ khách hàng',
      editable: true
    },
    {
      id: 'GEN-004',
      category: 'general',
      name: 'Bảo trì hệ thống',
      value: false,
      description: 'Bật/tắt chế độ bảo trì',
      editable: true
    },
    
    // Payment Settings
    {
      id: 'PAY-001',
      category: 'payment',
      name: 'Thanh toán COD',
      value: true,
      description: 'Cho phép thanh toán khi nhận hàng',
      editable: true
    },
    {
      id: 'PAY-002',
      category: 'payment',
      name: 'Thanh toán chuyển khoản',
      value: true,
      description: 'Cho phép thanh toán qua chuyển khoản',
      editable: true
    },
    {
      id: 'PAY-003',
      category: 'payment',
      name: 'Thanh toán VNPay',
      value: true,
      description: 'Tích hợp cổng thanh toán VNPay',
      editable: true
    },
    {
      id: 'PAY-004',
      category: 'payment',
      name: 'Phí xử lý thanh toán (%)',
      value: 2.5,
      description: 'Phần trăm phí giao dịch',
      editable: true
    },

    // Delivery Settings
    {
      id: 'DEL-001',
      category: 'delivery',
      name: 'Phí ship nội thành',
      value: 30000,
      description: 'Phí giao hàng trong nội thành (VNĐ)',
      editable: true
    },
    {
      id: 'DEL-002',
      category: 'delivery',
      name: 'Phí ship ngoại thành',
      value: 50000,
      description: 'Phí giao hàng ngoại thành (VNĐ)',
      editable: true
    },
    {
      id: 'DEL-003',
      category: 'delivery',
      name: 'Miễn phí ship từ',
      value: 500000,
      description: 'Giá trị đơn hàng để được miễn phí ship (VNĐ)',
      editable: true
    },
    {
      id: 'DEL-004',
      category: 'delivery',
      name: 'Giao hàng nhanh',
      value: true,
      description: 'Cho phép dịch vụ giao hàng nhanh',
      editable: true
    },

    // Notification Settings
    {
      id: 'NOT-001',
      category: 'notification',
      name: 'Email đơn hàng mới',
      value: true,
      description: 'Gửi email khi có đơn hàng mới',
      editable: true
    },
    {
      id: 'NOT-002',
      category: 'notification',
      name: 'SMS xác nhận',
      value: true,
      description: 'Gửi SMS xác nhận đơn hàng',
      editable: true
    },
    {
      id: 'NOT-003',
      category: 'notification',
      name: 'Thông báo khuyến mãi',
      value: true,
      description: 'Gửi thông báo về chương trình khuyến mãi',
      editable: true
    },
    {
      id: 'NOT-004',
      category: 'notification',
      name: 'Nhắc nhở đánh giá',
      value: false,
      description: 'Nhắc khách hàng đánh giá sau khi mua',
      editable: false
    },
  ]);

  const categories = [
    { id: 'general', label: 'Chung', icon: '⚙️' },
    { id: 'payment', label: 'Thanh toán', icon: '💳' },
    { id: 'delivery', label: 'Vận chuyển', icon: '🚚' },
    { id: 'notification', label: 'Thông báo', icon: '🔔' },
  ];

  const stats = [
    { label: 'Cấu hình hoạt động', value: '24', icon: '✅' },
    { label: 'Cần kiểm tra', value: '3', icon: '⚠️' },
    { label: 'Uptime', value: '99.8%', icon: '⏱️' },
    { label: 'Người dùng online', value: '156', icon: '👥' },
  ];

  const filteredConfigs = configs.filter(config => config.category === activeCategory);

  const handleSaveConfig = (config: SystemConfig, newValue: string | boolean | number) => {
    setConfigs(configs.map(c => 
      c.id === config.id ? { ...c, value: newValue } : c
    ));
    setEditingConfig(null);
  };

  const renderConfigValue = (config: SystemConfig) => {
    if (typeof config.value === 'boolean') {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.value}
            onChange={(e) => handleSaveConfig(config, e.target.checked)}
            disabled={!config.editable}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
        </label>
      );
    }

    if (editingConfig?.id === config.id) {
      return (
        <div className="flex gap-2">
          <input
            type={typeof config.value === 'number' ? 'number' : 'text'}
            defaultValue={config.value.toString()}
            className="flex-1 px-3 py-2 border-2 border-gray-900 rounded-lg focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value;
                handleSaveConfig(config, typeof config.value === 'number' ? parseFloat(value) : value);
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"], input[type="number"]') as HTMLInputElement;
              const value = input.value;
              handleSaveConfig(config, typeof config.value === 'number' ? parseFloat(value) : value);
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            Lưu
          </button>
          <button
            onClick={() => setEditingConfig(null)}
            className="px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-lg hover:border-gray-900 transition-all"
          >
            Hủy
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">{config.value.toString()}</span>
        {config.editable && (
          <button
            onClick={() => setEditingConfig(config)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
          >
            ✏️ Sửa
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('staff-dashboard')}
                className="w-10 h-10 flex items-center justify-center border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-all"
              >
                ←
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xl text-white font-playfair font-bold">M</span>
              </div>
              <div>
                <h1 className="text-xl font-playfair font-bold text-gray-900">Cài đặt hệ thống</h1>
                <p className="text-xs text-gray-600">Modern Ritual Staff Panel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all">
                💾 Sao lưu dữ liệu
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{stat.icon}</div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Categories */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-gray-900 mb-4 px-2">Danh mục</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-3 ${
                      activeCategory === category.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg text-white">
                <h4 className="font-bold mb-2">⚠️ Cảnh báo</h4>
                <p className="text-xs text-gray-200">
                  Thay đổi cài đặt hệ thống có thể ảnh hưởng đến hoạt động. Hãy thận trọng!
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {categories.find(c => c.id === activeCategory)?.label}
              </h2>

              <div className="space-y-4">
                {filteredConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="p-5 border-2 border-gray-200 rounded-xl hover:border-gray-900 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{config.name}</h3>
                        <p className="text-sm text-gray-600">{config.description}</p>
                        <span className="inline-block mt-2 text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          ID: {config.id}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      {renderConfigValue(config)}
                    </div>

                    {!config.editable && (
                      <div className="mt-2 text-xs text-gray-500">
                        🔒 Cài đặt này không thể chỉnh sửa
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* System Actions */}
            <div className="mt-6 bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác hệ thống</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all text-left">
                  <div className="text-2xl mb-2">🔄</div>
                  <h3 className="font-bold mb-1">Làm mới cache</h3>
                  <p className="text-sm text-gray-600">Xóa bộ nhớ cache hệ thống</p>
                </button>

                <button className="p-4 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all text-left">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-bold mb-1">Xuất báo cáo</h3>
                  <p className="text-sm text-gray-600">Tải xuống báo cáo hệ thống</p>
                </button>

                <button className="p-4 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all text-left">
                  <div className="text-2xl mb-2">🗄️</div>
                  <h3 className="font-bold mb-1">Sao lưu database</h3>
                  <p className="text-sm text-gray-600">Tạo bản sao lưu dữ liệu</p>
                </button>

                <button className="p-4 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all text-left">
                  <div className="text-2xl mb-2">🚨</div>
                  <h3 className="font-bold mb-1">Reset hệ thống</h3>
                  <p className="text-sm">Khôi phục cài đặt mặc định</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
