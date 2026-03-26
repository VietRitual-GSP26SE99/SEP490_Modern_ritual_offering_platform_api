import React, { useState, useEffect } from 'react';
import { staffService, CeremonyCategory } from '../../services/staffService';
import Swal from 'sweetalert2';
import toast from '../../services/toast';

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
  const [activeCategory, setActiveCategory] = useState<'general' | 'payment' | 'delivery' | 'notification' | 'ceremony'>('general');
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [ceremonyCategories, setCeremonyCategories] = useState<CeremonyCategory[]>([]);
  const [isCeremonyLoading, setIsCeremonyLoading] = useState(false);
  const [isCeremonyModalOpen, setIsCeremonyModalOpen] = useState(false);
  const [editingCeremony, setEditingCeremony] = useState<CeremonyCategory | null>(null);

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
      name: 'Thanh toán PayOS',
      value: true,
      description: 'Tích hợp cổng thanh toán PayOS',
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
    { id: 'general', label: 'Chung', icon: '' },
    { id: 'payment', label: 'Thanh toán', icon: '' },
    { id: 'delivery', label: 'Vận chuyển', icon: '' },
    { id: 'notification', label: 'Thông báo', icon: '' },
    { id: 'ceremony', label: 'Thể loại nghi lễ', icon: '' },
  ];

  const stats = [
    { label: 'Cấu hình hoạt động', value: '24', icon: '' },
    { label: 'Cần kiểm tra', value: '3', icon: '' },
    { label: 'Uptime', value: '99.8%', icon: '' },
    { label: 'Người dùng online', value: '156', icon: '' },
  ];

  const filteredConfigs = configs.filter(config => config.category === activeCategory);

  const handleSaveConfig = (config: SystemConfig, newValue: string | boolean | number) => {
    setConfigs(configs.map(c =>
      c.id === config.id ? { ...c, value: newValue } : c
    ));
    setEditingConfig(null);
  };

  // --- Ceremony Categories Logic ---
  const fetchCeremonyCategories = async () => {
    try {
      setIsCeremonyLoading(true);
      const data = await staffService.getCeremonyCategories();
      setCeremonyCategories(data);
    } catch (error) {
      console.error('Failed to fetch ceremony categories:', error);
      toast.error('Không thể tải danh sách thể loại nghi lễ');
    } finally {
      setIsCeremonyLoading(false);
    }
  };

  useEffect(() => {
    if (activeCategory === 'ceremony') {
      fetchCeremonyCategories();
    }
  }, [activeCategory]);

  const handleOpenCeremonyModal = (category?: CeremonyCategory) => {
    setEditingCeremony(category || null);
    setIsCeremonyModalOpen(true);
  };

  const handleSaveCeremony = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên thể loại');
      return;
    }

    try {
      if (editingCeremony) {
        await staffService.updateCeremonyCategory(editingCeremony.categoryId, { name, description });
        toast.success('Cập nhật thể loại thành công');
      } else {
        await staffService.createCeremonyCategory({ name, description });
        toast.success('Thêm thể loại mới thành công');
      }
      setIsCeremonyModalOpen(false);
      fetchCeremonyCategories();
    } catch (error: any) {
      toast.error(error.message || 'Thao tác thất bại');
    }
  };

  const handleReactivateCeremony = async (id: number) => {
    try {
      await staffService.reactivateCeremonyCategory(id);
      toast.success('Khôi phục thể loại thành công');
      fetchCeremonyCategories();
    } catch (error: any) {
      toast.error(error.message || 'Khôi phục thất bại');
    }
  };

  const handleDeleteCeremony = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tạm ngưng thể loại?',
      text: "Thể loại này sẽ không hiển thị công khai trên hệ thống.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await staffService.deleteCeremonyCategory(id);
        toast.success('Đã tạm ngưng thể loại');
        fetchCeremonyCategories();
      } catch (error: any) {
        toast.error(error.message || 'Thao tác thất bại');
      }
    }
  };

  const renderCeremonyTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý thể loại nghi lễ</h2>
          <button
            onClick={() => handleOpenCeremonyModal()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm flex items-center gap-2"
          >
            <span>➕</span> Thêm thể loại
          </button>
        </div>

        {isCeremonyLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ceremonyCategories.map((cat) => (
              <div
                key={cat.categoryId}
                className={`p-5 border rounded-2xl bg-white transition shadow-sm group ${cat.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-slate-100 opacity-75'
                  }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`size-2 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      <span className="text-xs font-medium text-slate-500">
                        {cat.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenCeremonyModal(cat)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    {cat.isActive ? (
                      <button
                        onClick={() => handleDeleteCeremony(cat.categoryId)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Tạm ngưng"
                      >
                        🗑️
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateCeremony(cat.categoryId)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Khôi phục"
                      >
                        🔄
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
                  {cat.description || 'Chưa có mô tả cho thể loại này.'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Ceremony Modal */}
        {isCeremonyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCeremony ? 'Cập nhật thể loại' : 'Thêm thể loại nghi lễ'}
                </h3>
                <button
                  onClick={() => setIsCeremonyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveCeremony} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên thể loại</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingCeremony?.name}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition"
                    placeholder="VD: Lễ Cúng Giao Thừa"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingCeremony?.description}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition"
                    placeholder="Mô tả ý nghĩa của lễ cúng..."
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCeremonyModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-md"
                  >
                    {editingCeremony ? 'Lưu thay đổi' : 'Tạo thể loại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
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
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
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
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Lưu
          </button>
          <button
            onClick={() => setEditingConfig(null)}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:border-slate-300 transition"
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
            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            Sửa
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-gray-600 mt-1">Cấu hình vận hành và chính sách nền tảng</p>
        </div>
        <div>
          <button className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800">
            Lưu thay đổi
          </button>
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition"
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
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-gray-900 mb-4 px-2">Danh mục</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center gap-3 ${activeCategory === category.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-gray-600 hover:bg-slate-100'
                      }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-900 rounded-lg text-white">
                <h4 className="font-bold mb-2"> Cảnh báo</h4>
                <p className="text-xs text-slate-200">
                  Thay đổi cài đặt hệ thống có thể ảnh hưởng đến hoạt động. Hãy thận trọng!
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 space-y-6">
            {activeCategory === 'ceremony' ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                {renderCeremonyTab()}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {categories.find(c => c.id === activeCategory)?.label}
                </h2>

                <div className="space-y-4">
                  {filteredConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition"
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
                          Cài đặt này không thể chỉnh sửa
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
