import React, { useEffect, useState } from 'react';
import { approveWithdrawal, getWithdrawalRequests, rejectWithdrawal, WithdrawalListItem } from '../../services/walletService';
import { refundService, RefundRecord } from '../../services/refundService';
import toast from '../../services/toast';
import Swal from 'sweetalert2';
import { userService, UserListItem, CreateUserRequest } from '../../services/userService';
import { vendorService, VendorTier } from '../../services/vendorService';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'users' | 'orders' | 'disputes' | 'content' | 'withdrawals'>('overview');
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalListItem[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState<string | null>(null);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<RefundRecord[]>([]);
  const [isLoadingRefunds, setIsLoadingRefunds] = useState(false);
  const [refundsError, setRefundsError] = useState<string | null>(null);
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [vendorTiers, setVendorTiers] = useState<VendorTier[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [tiersError, setTiersError] = useState<string | null>(null);

  const adminStats = [
    { label: 'Tổng doanh thu', value: '1.2B₫', icon: 'trending_up', color: 'text-green-600' },
    { label: 'Nhà cung cấp hoạt động', value: '156', icon: 'store', color: 'text-blue-600' },
    { label: 'Khách hàng hoạt động', value: '8,234', icon: 'people', color: 'text-purple-600' },
    { label: 'Đơn hàng ngày', value: '234', icon: 'shopping_cart_checkout', color: 'text-orange-600' }
  ];

  const recentOrders = [
    { id: '#MRT-8829', customer: 'Nguyễn Văn A', vendor: 'Mâm Cúng Hạnh Phúc', amount: 2500000, status: 'Đang giao', time: '10 phút trước' },
    { id: '#MRT-8828', customer: 'Trần Thị B', vendor: 'Lễ Vật An Khang', amount: 4950000, status: 'Hoàn tất', time: '1 giờ trước' },
    { id: '#MRT-8827', customer: 'Lê Văn C', vendor: 'Mâm Cúng Tâm Linh', amount: 1850000, status: 'Chờ xác nhận', time: '2 giờ trước' }
  ];

  const pendingVendors = [
    { id: 1, name: 'Lễ Vật Phương Đông', city: 'TP. HCM', submitted: '3 ngày trước', docs: 'Đầy đủ' },
    { id: 2, name: 'Mâm Cúng Đất Việt', city: 'Hà Nội', submitted: '5 ngày trước', docs: 'Đầy đủ' },
    { id: 3, name: 'Cúng Lễ An Phúc', city: 'Đà Nẵng', submitted: '1 tuần trước', docs: 'Thiếu CCCD' }
  ];

  const disputes = [
    { id: '#DIS-001', complaint: 'Sản phẩm không đúng với mô tả', customer: 'Trần Hương', vendor: 'Mâm Cúng A', status: 'Chờ xử lý', date: '2024-01-12' },
    { id: '#DIS-002', complaint: 'Giao hàng quá trễ', customer: 'Lê Minh', vendor: 'Lễ Vật B', status: 'Đang xử lý', date: '2024-01-11' }
  ];

  const loadWithdrawalRequests = async () => {
    setIsLoadingWithdrawals(true);
    setWithdrawalsError(null);

    try {
      const data = await getWithdrawalRequests();
      setWithdrawalRequests(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách rút tiền.';
      setWithdrawalsError(message);
      setWithdrawalRequests([]);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'withdrawals' && withdrawalRequests.length === 0 && !isLoadingWithdrawals) {
      loadWithdrawalRequests();
    }
  }, [activeTab]);

  const loadRefundRequests = async () => {
    setIsLoadingRefunds(true);
    setRefundsError(null);

    try {
      const data = await refundService.getAllRefunds();
      setRefundRequests(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách hoàn tiền.';
      setRefundsError(message);
      setRefundRequests([]);
    } finally {
      setIsLoadingRefunds(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'disputes' && refundRequests.length === 0 && !isLoadingRefunds) {
      loadRefundRequests();
    }
  }, [activeTab]);

  const loadVendorTiers = async () => {
    setIsLoadingTiers(true);
    setTiersError(null);
    try {
      const data = await vendorService.getVendorTiers();
      setVendorTiers(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách hạng nhà cung cấp.';
      setTiersError(message);
    } finally {
      setIsLoadingTiers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vendors') {
      loadVendorTiers();
    }
  }, [activeTab]);

  const handleEditVendorTier = async (tierId: number) => {
    try {
      Swal.fire({
        title: 'Đang tải...',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      const tier = await vendorService.getVendorTierById(tierId);
      if (!tier) throw new Error('Không tìm thấy thông tin hạng');

      const showModal = async (isEdit: boolean = false) => {
        const result = await Swal.fire({
          title: isEdit ? `Chỉnh sửa Hạng ${tier.tierName}` : `Thông tin Hạng ${tier.tierName}`,
          width: 600,
          showCancelButton: true,
          showDenyButton: !isEdit,
          confirmButtonText: isEdit ? 'Lưu thay đổi' : 'Đóng',
          cancelButtonText: 'Hủy',
          denyButtonText: 'Chỉnh sửa',
          customClass: {
            confirmButton: `rounded-2xl font-black px-8 py-4 text-white shadow-lg transition-all active:scale-95 ${isEdit ? 'bg-gradient-to-r from-primary to-primary/80 hover:shadow-primary/30' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`,
            cancelButton: 'rounded-2xl font-black px-8 py-4 text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all ml-3 active:scale-95',
            denyButton: 'rounded-2xl font-black px-8 py-4 text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:shadow-orange-200 transition-all ml-3 active:scale-95',
            popup: 'rounded-[3rem] border-none shadow-2xl',
            container: 'backdrop-blur-sm bg-white/30',
          },
          html: `
            <div class="text-left space-y-8 p-4">
              <!-- Header Section with Icon -->
              <div class="flex items-center gap-4 mb-2">
                <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-3xl">${isEdit ? 'edit_note' : 'verified'}</span>
                </div>
                <div>
                  <h3 class="text-lg font-black text-slate-800 leading-none mb-1">Cấu hình phân hạng</h3>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Hạng ${tier.tierName}</p>
                </div>
              </div>

              <!-- Main Form Grid -->
              <div class="grid grid-cols-1 gap-6">
                <!-- Group 1: Identity & Description -->
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="relative group">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">Tên hạng</label>
                      <input id="tier-name" 
                        class="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 shadow-sm ${!isEdit ? 'opacity-70 pointer-events-none' : ''}" 
                        value="${tier.tierName}" ${!isEdit ? 'readonly' : ''}>
                    </div>
                    <div class="relative group">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">Hoa hồng (%)</label>
                      <div class="relative">
                        <input id="commission-rate" type="number" 
                          class="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none transition-all text-sm font-black text-primary shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isEdit ? 'opacity-70 pointer-events-none' : ''}" 
                          value="${tier.commissionRate}" ${!isEdit ? 'readonly' : ''}>
                        <span class="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  <div class="relative group">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">Mô tả định hướng</label>
                    <textarea id="tier-description" 
                      class="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none transition-all text-sm font-medium text-slate-600 shadow-sm min-h-[100px] leading-relaxed ${!isEdit ? 'opacity-70 pointer-events-none' : ''}" 
                      ${!isEdit ? 'readonly' : ''}>${tier.description}</textarea>
                  </div>
                </div>

                <!-- Group 2: Requirements (The conditions) -->
                <div class="bg-ritual-bg/50 p-6 rounded-[2rem] border border-gold/10 space-y-5">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-black text-gold uppercase tracking-widest flex items-center gap-2">
                       <span class="material-symbols-outlined text-lg">military_tech</span>
                       Điều kiện nâng hạng
                    </h4>
                    ${!tier.isActive ? '<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase">Tạm dừng</span>' : ''}
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white p-4 rounded-2xl border border-gold/5 shadow-sm hover:shadow-md transition-shadow">
                      <p class="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest text-center">Đơn hàng</p>
                      <input id="min-orders" type="number" 
                        class="w-full p-2 bg-transparent text-center text-lg font-black text-slate-700 outline-none border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        value="${tier.minCompletedOrders}" ${!isEdit ? 'readonly disabled' : ''}>
                      <p class="text-[9px] text-center text-slate-400 font-bold italic mt-1">tối thiểu</p>
                    </div>
                    <div class="bg-white p-4 rounded-2xl border border-gold/5 shadow-sm hover:shadow-md transition-shadow">
                      <p class="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest text-center">Doanh thu</p>
                      <input id="min-revenue" type="number" 
                        class="w-full p-2 bg-transparent text-center text-lg font-black text-slate-700 outline-none border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        value="${tier.minRevenueAmount}" ${!isEdit ? 'readonly disabled' : ''}>
                      <p class="text-[9px] text-center text-slate-400 font-bold italic mt-1">triệu VNĐ</p>
                    </div>
                    <div class="bg-white p-4 rounded-2xl border border-gold/5 shadow-sm hover:shadow-md transition-shadow">
                      <p class="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest text-center">Rating</p>
                      <div class="flex items-center justify-center gap-1">
                        <input id="min-rating" type="number" step="0.1" 
                          class="w-12 p-2 bg-transparent text-center text-lg font-black text-slate-700 outline-none border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          value="${tier.minRatingAvg}" ${!isEdit ? 'readonly disabled' : ''}>
                        <span class="text-amber-400 material-symbols-outlined text-lg">star</span>
                      </div>
                      <p class="text-[9px] text-center text-slate-400 font-bold italic mt-1">điểm trung bình</p>
                    </div>
                  </div>
                </div>

                <!-- Status & Toggle -->
                <div class="flex items-center justify-between px-2">
                  <div class="flex items-center gap-3">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="tier-active" class="sr-only peer" ${tier.isActive ? 'checked' : ''} ${!isEdit ? 'disabled' : ''}>
                      <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary ${!isEdit ? 'opacity-50' : ''}"></div>
                    </label>
                    <div>
                      <span class="text-sm font-black text-slate-700 block leading-none mb-1">Kích hoạt hạng</span>
                      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${tier.isActive ? 'Đang hoạt động' : 'Đã tạm dừng'}</p>
                    </div>
                  </div>
                  
                  ${!isEdit ? `
                    <div class="text-[10px] font-black text-slate-300 uppercase italic">
                      Nhấn 'Chỉnh sửa' để thay đổi
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `,
          preConfirm: () => {
            if (!isEdit) return null;
            return {
              tierName: (document.getElementById('tier-name') as HTMLInputElement).value,
              commissionRate: parseInt((document.getElementById('commission-rate') as HTMLInputElement).value),
              description: (document.getElementById('tier-description') as HTMLTextAreaElement).value,
              minCompletedOrders: parseInt((document.getElementById('min-orders') as HTMLInputElement).value),
              minRevenueAmount: parseFloat((document.getElementById('min-revenue') as HTMLInputElement).value),
              minRatingAvg: parseFloat((document.getElementById('min-rating') as HTMLInputElement).value),
              isActive: (document.getElementById('tier-active') as HTMLInputElement).checked
            };
          }
        });

        if (result.isDenied) {
          // Chuyển sang chế độ sửa
          showModal(true);
        } else if (result.isConfirmed && isEdit && result.value) {
          // Lưu thay đổi
          Swal.fire({
            title: 'Đang cập nhật...',
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false,
            showConfirmButton: false,
          });

          const success = await vendorService.updateVendorTier(tierId, result.value);
          if (success) {
            toast.success('Cập nhật hạng thành công');
            loadVendorTiers();
            Swal.close();
          } else {
            toast.error('Cập nhật thất bại');
            showModal(true); // Mở lại form sửa
          }
        }
      };

      showModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi xử lý hạng');
    }
  };

  const handleCreateVendorTier = async () => {
    console.log('DEBUG: handleCreateVendorTier clicked');
    try {
      const { value: formValues } = await Swal.fire({
        title: 'Thêm Hạng Vendor mới',
        width: 600,
        showCancelButton: true,
        confirmButtonText: 'Tạo hạng',
        cancelButtonText: 'Hủy',
        customClass: {
          confirmButton: 'rounded-2xl font-black px-8 py-4 text-white bg-gradient-to-r from-primary to-primary/80 shadow-lg transition-all active:scale-95 hover:shadow-primary/30',
          cancelButton: 'rounded-2xl font-black px-8 py-4 text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all ml-3 active:scale-95',
          popup: 'rounded-[3rem] border-none shadow-2xl',
          container: 'backdrop-blur-sm bg-white/30',
        },
        html: `
          <div class="text-left space-y-6 p-4">
            <div class="flex items-center gap-4 mb-2">
              <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-3xl">add_card</span>
              </div>
              <div>
                <h3 class="text-xl font-black text-slate-800 leading-tight">Cấu hình hạng mới</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Thiết lập các đặc quyền và điều kiện</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-wider">Tên hạng</label>
                  <input id="new-tier-name" class="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 shadow-sm" placeholder="Ví dụ: Kim cương, Bạch kim...">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-wider">Phần trăm hoa hồng (%)</label>
                  <input id="new-commission-rate" type="number" class="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none transition-all text-sm font-black text-primary shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="10">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-wider">Mô tả đặc quyền</label>
                <textarea id="new-tier-description" class="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none transition-all text-sm font-medium text-slate-600 h-24 resize-none shadow-sm" placeholder="Mô tả ngắn gọn về các ưu đãi của hạng này..."></textarea>
              </div>

              <div class="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-symbols-outlined text-primary text-xl">verified</span>
                  <p class="text-[10px] font-black text-primary uppercase tracking-widest">Điều kiện nâng hạng</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div class="space-y-1.5">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đơn hàng</p>
                    <input id="new-min-orders" type="number" class="w-full bg-white/50 p-2 text-center text-lg font-black text-slate-700 outline-none rounded-xl border border-primary/5 focus:border-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0">
                    <p class="text-[9px] text-slate-400 font-bold italic">tối thiểu</p>
                  </div>
                  <div class="space-y-1.5">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Doanh thu</p>
                    <input id="new-min-revenue" type="number" class="w-full bg-white/50 p-2 text-center text-lg font-black text-slate-700 outline-none rounded-xl border border-primary/5 focus:border-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0">
                    <p class="text-[9px] text-slate-400 font-bold italic">triệu VNĐ</p>
                  </div>
                  <div class="space-y-1.5">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rating</p>
                    <input id="new-min-rating" type="number" step="0.1" class="w-full bg-white/50 p-2 text-center text-lg font-black text-slate-700 outline-none rounded-xl border border-primary/5 focus:border-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="5.0">
                    <p class="text-[9px] text-slate-400 font-bold italic">điểm TB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
          const tierName = (document.getElementById('new-tier-name') as HTMLInputElement).value;
          const commissionRateStr = (document.getElementById('new-commission-rate') as HTMLInputElement).value;
          const description = (document.getElementById('new-tier-description') as HTMLTextAreaElement).value;
          const minOrdersStr = (document.getElementById('new-min-orders') as HTMLInputElement).value;
          const minRevenueStr = (document.getElementById('new-min-revenue') as HTMLInputElement).value;
          const minRatingStr = (document.getElementById('new-min-rating') as HTMLInputElement).value;

          if (!tierName) {
            Swal.showValidationMessage('Vui lòng nhập tên hạng');
            return false;
          }

          return {
            tierName,
            commissionRate: parseInt(commissionRateStr) || 0,
            description: description || '',
            minCompletedOrders: parseInt(minOrdersStr) || 0,
            minRevenueAmount: parseFloat(minRevenueStr) || 0,
            minRatingAvg: parseFloat(minRatingStr) || 5.0
          };
        }
      });

      if (formValues) {
        Swal.fire({
          title: 'Đang tạo...',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        const success = await vendorService.createVendorTier(formValues);
        if (success) {
          toast.success('Tạo hạng thành công');
          loadVendorTiers();
          Swal.close();
        } else {
          toast.error('Tạo hạng thất bại');
          Swal.close();
        }
      }
    } catch (error) {
      console.error('DEBUG: Error in handleCreateVendorTier:', error);
      toast.error('Lỗi khi mở form tạo hạng');
    }
  };

  const handleDeleteVendorTier = async (tierId: number, tierName: string) => {
    const result = await Swal.fire({
      title: `Xóa hạng ${tierName}?`,
      text: "Bạn không thể hoàn tác thao tác này và hạng chỉ bị xóa khi không có vendor nào đang sử dụng.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đúng, xóa nó!',
      cancelButtonText: 'Hủy',
      customClass: {
        confirmButton: 'rounded-xl font-bold px-6 py-3 bg-red-600 text-white mr-2 shadow-lg shadow-red-200',
        cancelButton: 'rounded-xl font-bold px-6 py-3 bg-slate-100 text-slate-600',
        popup: 'rounded-[2rem]',
      }
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Đang xóa...',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        const success = await vendorService.deleteVendorTier(tierId);
        if (success) {
          toast.success('Xóa hạng thành công');
          loadVendorTiers();
          Swal.close();
        }
      } catch (error) {
        Swal.close();
        toast.error(error instanceof Error ? error.message : 'Xóa thất bại');
      }
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await userService.getAllUsers(roleFilter || undefined, statusFilter || undefined);
      setUsers(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách người dùng.';
      setUsersError(message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    // Luôn tải lại khi filter thay đổi hoặc khi tab người dùng lần đầu hiển thị
    if (activeTab === 'users' && !isLoadingUsers) {
      loadUsers();
    }
  }, [activeTab, roleFilter, statusFilter]);

  const handleCreateUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Thêm Admin/Staff mới',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Họ và tên</label>
            <input id="swal-fullname" class="swal2-input !m-0 !w-full" placeholder="Nguyễn Văn A">
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input id="swal-email" type="email" class="swal2-input !m-0 !w-full" placeholder="admin@example.com">
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
            <input id="swal-phone" class="swal2-input !m-0 !w-full" placeholder="0901234567">
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
            <input id="swal-password" type="password" class="swal2-input !m-0 !w-full" placeholder="••••••••">
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Vai trò</label>
            <select id="swal-role" class="swal2-input !m-0 !w-full">
              <option value="Staff">Nhân viên (Staff)</option>
              <option value="Admin">Quản trị viên (Admin)</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tạo tài khoản',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#B4935A',
      preConfirm: () => {
        const fullName = (document.getElementById('swal-fullname') as HTMLInputElement).value;
        const email = (document.getElementById('swal-email') as HTMLInputElement).value;
        const phoneNumber = (document.getElementById('swal-phone') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const role = (document.getElementById('swal-role') as HTMLSelectElement).value;

        if (!fullName || !email || !phoneNumber || !password) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin');
          return false;
        }

        return { email, password, fullName, phoneNumber, role };
      }
    });

    if (formValues) {
      setIsCreatingUser(true);
      try {
        await userService.createUser(formValues as CreateUserRequest);
        toast.success('Tạo tài khoản thành công!');
        loadUsers();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Tạo tài khoản thất bại');
      } finally {
        setIsCreatingUser(false);
      }
    }
  };

  const getStatusTheme = (status: string): string => {
    const normalized = status.toLowerCase();

    if (normalized.includes('hoàn tất') || normalized.includes('completed') || normalized.includes('đã duyệt') || normalized.includes('approved')) {
      return 'bg-green-100 text-green-700';
    }

    if (normalized.includes('đang xử lý') || normalized.includes('processing')) {
      return 'bg-blue-100 text-blue-700';
    }

    if (normalized.includes('từ chối') || normalized.includes('rejected')) {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-yellow-100 text-yellow-700';
  };

  const isFinalWithdrawalStatus = (status: string): boolean => {
    const normalized = status.toLowerCase();
    return (
      normalized.includes('hoàn tất') ||
      normalized.includes('completed') ||
      normalized.includes('đã duyệt') ||
      normalized.includes('approved') ||
      normalized.includes('từ chối') ||
      normalized.includes('rejected')
    );
  };

  const getDisplayStatus = (status: string): string => {
    const normalized = status.toLowerCase();

    if (normalized.includes('pending') || normalized.includes('chờ duyệt')) {
      return 'Chờ duyệt';
    }

    if (normalized.includes('processing') || normalized.includes('đang xử lý')) {
      return 'Đang xử lý';
    }

    if (normalized.includes('approved') || normalized.includes('đã duyệt') || normalized.includes('hoàn tất') || normalized.includes('completed')) {
      return 'Đã duyệt';
    }

    if (normalized.includes('rejected') || normalized.includes('từ chối')) {
      return 'Đã từ chối';
    }

    return status;
  };

  const formatDateTimeVN = (value: string): string => {
    if (!value || value === 'Chưa xác định') {
      return 'Chưa xác định';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const seconds = String(parsed.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleViewUserDetail = async (userId: string) => {
    try {
      Swal.fire({
        title: 'Đang tải...',
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      const user = await userService.getUserById(userId);

      Swal.fire({
        title: 'Chi tiết người dùng',
        width: 600,
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#B4935A',
        customClass: {
          popup: 'rounded-2xl',
        },
        html: `
          <div class="text-left space-y-4 p-4">
            <div class="flex items-center gap-6 mb-6">
              <div class="w-24 h-24 rounded-full bg-ritual-bg border-2 border-gold/20 overflow-hidden flex items-center justify-center">
                ${user.avatarUrl ? `<img src="${user.avatarUrl}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-4xl text-gold/30">person</span>`}
              </div>
              <div>
                <h3 class="text-xl font-bold text-primary">${user.fullName || 'N/A'}</h3>
                <p class="text-slate-500">${user.email}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  ${user.roles.map(role => `
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${role === 'Admin' ? 'bg-purple-100 text-purple-700' :
            role === 'Staff' ? 'bg-blue-100 text-blue-700' :
              role === 'Vendor' ? 'bg-orange-100 text-orange-700' :
                'bg-slate-100 text-slate-700'
          }">${role}</span>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 border-t border-gold/10 pt-4">
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase">User ID</p>
                <p class="text-sm font-medium text-slate-700 truncate" title="${user.userId}">${user.userId}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase">Trạng thái</p>
                <p class="text-sm font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-red-600'}">${user.status}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase">Số điện thoại</p>
                <p class="text-sm font-medium text-slate-700">${user.phoneNumber || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase">Ngày tạo</p>
                <p class="text-sm font-medium text-slate-700">${user.createdAt ? formatDateTimeVN(user.createdAt) : 'N/A'}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase">Profile ID</p>
                <p class="text-sm font-medium text-primary">${user.profileId || 'N/A'}</p>
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-6">
              <button id="toggle-status-btn" class="w-full py-2.5 rounded-xl font-bold transition-all ${user.status === 'Active'
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-green-50 text-green-600 hover:bg-green-100'
          }">
                ${user.status === 'Active' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này'}
              </button>
            </div>
          </div>
        `,
        didOpen: () => {
          const btn = document.getElementById('toggle-status-btn');
          if (btn) {
            btn.onclick = () => {
              Swal.close();
              handleToggleUserStatus(user);
            };
          }
        }
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải thông tin chi tiết');
    }
  };

  const handleToggleUserStatus = async (user: UserListItem) => {
    const isBanning = user.status === 'Active';
    const actionText = isBanning ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
    const newStatus = isBanning ? 'Banned' : 'Active';

    const { value: reason, isConfirmed } = await Swal.fire({
      title: actionText,
      text: `Bạn có chắc muốn ${isBanning ? 'khóa' : 'mở khóa'} tài khoản này không?`,
      input: isBanning ? 'textarea' : undefined,
      inputPlaceholder: 'Lý do (không bắt buộc)...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      confirmButtonColor: isBanning ? '#ef4444' : '#22c55e',
    });

    if (isConfirmed) {
      try {
        Swal.fire({
          title: 'Đang xử lý...',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        const apiReason = typeof reason === 'string' ? reason : '';
        await userService.updateUserStatus(user.userId, newStatus, apiReason);
        toast.success(`${actionText} thành công`);

        // Refresh users list
        loadUsers();

        // Close modal or show success message
        Swal.close();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái');
      }
    }
  };

  const formatCurrencyVN = (value: number): string => `${value.toLocaleString('vi-VN')}đ`;

  const escapeHtml = (value: unknown): string => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getPendingCount = (): number => {
    return withdrawalRequests.filter((item) => {
      const status = item.status.toLowerCase();
      return status.includes('chờ duyệt') || status.includes('pending');
    }).length;
  };

  const handleViewWithdrawalDetail = async (request: WithdrawalListItem) => {
    const rawData = request.raw || {};
    const transaction = (rawData.transaction || rawData.Transaction || {}) as Record<string, unknown>;

    const withdrawalId = String(rawData.withdrawalId || rawData.WithdrawalId || request.id);
    const accountHolder = String(rawData.accountHolder || rawData.AccountHolder || request.vendor || 'N/A');
    const rejectionReason = rawData.rejectionReason || rawData.RejectionReason;
    const processedDate = String(rawData.processedDate || rawData.ProcessedDate || '');
    const createdDate = String(rawData.createdDate || rawData.CreatedDate || request.requestedAt || '');
    const walletId = String(rawData.walletId || rawData.WalletId || transaction.walletId || transaction.WalletId || 'N/A');

    const transactionId = String(transaction.transactionId || transaction.TransactionId || 'N/A');
    const transactionType = String(transaction.type || transaction.Type || 'N/A');
    const transactionStatus = String(transaction.status || transaction.Status || request.status);
    const transactionDescription = String(transaction.description || transaction.Description || '');
    const balanceAfterRaw = transaction.balanceAfter || transaction.BalanceAfter;
    const balanceAfter = typeof balanceAfterRaw === 'number' ? balanceAfterRaw : Number(balanceAfterRaw);
    const localizedStatus = getDisplayStatus(request.status);
    const localizedTransactionStatus = getDisplayStatus(transactionStatus);
    const resolvedShopName = request.vendor;

    const statusStyle = (() => {
      const normalized = request.status.toLowerCase();
      if (normalized.includes('approved') || normalized.includes('đã duyệt') || normalized.includes('hoàn tất') || normalized.includes('completed')) {
        return 'background:#dcfce7;color:#166534;';
      }
      if (normalized.includes('processing') || normalized.includes('đang xử lý')) {
        return 'background:#dbeafe;color:#1d4ed8;';
      }
      if (normalized.includes('rejected') || normalized.includes('từ chối')) {
        return 'background:#fee2e2;color:#b91c1c;';
      }
      return 'background:#fef3c7;color:#a16207;';
    })();

    await Swal.fire({
      title: 'Chi tiết yêu cầu rút tiền',
      width: 860,
      confirmButtonText: 'Đóng',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3 text-white bg-primary hover:opacity-90 transition-all'
      },
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.5; color:#334155;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%); margin-bottom:14px;">
            <div>
              <div style="font-size:12px; color:#64748b;">Mã yêu cầu</div>
              <div style="font-weight:700; color:#0f172a; margin-top:2px;">${escapeHtml(withdrawalId)}</div>
              <div style="font-size:12px; color:#64748b; margin-top:6px;">Nhà cung cấp: <span style="font-weight:600; color:#1e293b;">${escapeHtml(resolvedShopName)}</span></div>
            </div>
            <div style="text-align:right;">
              <span style="display:inline-block; padding:4px 10px; border-radius:999px; font-weight:700; font-size:12px; ${statusStyle}">${escapeHtml(localizedStatus)}</span>
              <div style="font-size:24px; font-weight:800; color:#0f172a; margin-top:8px;">${escapeHtml(formatCurrencyVN(request.amount))}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
            <div style="padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:#fff;">
              <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-weight:700;">THÔNG TIN RÚT TIỀN</div>
              <div><strong>Wallet ID:</strong> ${escapeHtml(walletId)}</div>
              <div><strong>Chủ tài khoản:</strong> ${escapeHtml(accountHolder)}</div>
              <div><strong>Tài khoản nhận:</strong> ${escapeHtml(request.bank)}</div>
              <div><strong>Thời gian tạo:</strong> ${escapeHtml(formatDateTimeVN(createdDate))}</div>
              <div><strong>Thời gian xử lý:</strong> ${escapeHtml(processedDate ? formatDateTimeVN(processedDate) : 'Chưa xử lý')}</div>
              <div><strong>Lý do từ chối:</strong> ${escapeHtml(rejectionReason ? String(rejectionReason) : 'Không có')}</div>
            </div>

            <div style="padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:#fff;">
              <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-weight:700;">THÔNG TIN GIAO DỊCH</div>
              <div><strong>Mã giao dịch:</strong> ${escapeHtml(transactionId)}</div>
              <div><strong>Loại:</strong> ${escapeHtml(transactionType)}</div>
              <div><strong>Trạng thái GD:</strong> ${escapeHtml(localizedTransactionStatus)}</div>
              <div><strong>Số dư sau GD:</strong> ${escapeHtml(Number.isFinite(balanceAfter) ? formatCurrencyVN(balanceAfter) : 'N/A')}</div>
              <div><strong>Mô tả:</strong> ${escapeHtml(transactionDescription || 'N/A')}</div>
            </div>
          </div>
        </div>
      `,
    });
  };

  const handleApproveWithdrawal = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Duyệt yêu cầu rút tiền?',
      text: 'Hành động này sẽ xác nhận chuyển tiền cho nhà cung cấp.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingWithdrawalId(requestId);

    try {
      await approveWithdrawal(requestId);
      await toast.success('Duyệt yêu cầu rút tiền thành công.');
      await loadWithdrawalRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Duyệt yêu cầu rút tiền thất bại.';
      await toast.error(message);
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    const result = await Swal.fire({
      title: 'Duyệt hoàn tiền?',
      text: 'Xác nhận duyệt yêu cầu hoàn tiền này.',
      input: 'text',
      inputPlaceholder: 'Ghi chú (tuỳ chọn)',
      showCancelButton: true,
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingRefundId(refundId);

    try {
      await refundService.approveRefund(refundId, String(result.value || ''));
      toast.success('Đã duyệt hoàn tiền.');
      await loadRefundRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể duyệt hoàn tiền.';
      toast.error(message);
    } finally {
      setProcessingRefundId(null);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    const result = await Swal.fire({
      title: 'Từ chối hoàn tiền?',
      input: 'text',
      inputPlaceholder: 'Lý do từ chối (bắt buộc)',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Vui lòng nhập lý do từ chối.';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingRefundId(refundId);

    try {
      await refundService.rejectRefund(refundId, String(result.value || ''));
      toast.success('Đã từ chối hoàn tiền.');
      await loadRefundRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể từ chối hoàn tiền.';
      toast.error(message);
    } finally {
      setProcessingRefundId(null);
    }
  };

  const handleRejectWithdrawal = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Từ chối yêu cầu rút tiền',
      input: 'text',
      inputLabel: 'Nhập lý do từ chối',
      inputValue: 'Sai thông tin tài khoản nhận tiền',
      inputPlaceholder: 'Ví dụ: Sai thông tin tài khoản nhận tiền',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Vui lòng nhập lý do từ chối.';
        }

        return null;
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    const normalizedReason = String(result.value || '').trim();

    setProcessingWithdrawalId(requestId);

    try {
      await rejectWithdrawal(requestId, normalizedReason);
      await toast.success('Đã từ chối yêu cầu rút tiền.');
      await loadWithdrawalRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Từ chối yêu cầu rút tiền thất bại.';
      await toast.error(message);
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ritual-bg via-white to-gold/5 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-black text-primary mb-2"> Bảng Điều Khiển Quản Trị Viên</h1>
          <p className="text-slate-500">Quản lý nền tảng, nhà cung cấp, khách hàng và đơn hàng</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {adminStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <span className={`material-symbols-outlined text-3xl ${stat.color}`}>{stat.icon}</span>
                {idx === 0 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+8.5%</span>}
              </div>
              <p className="text-sm text-slate-500 mb-1 uppercase font-bold tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-2 border border-gold/10 shadow-sm overflow-x-auto sticky top-[132px] z-40">
          {['overview', 'vendors', 'users', 'orders', 'disputes', 'content', 'withdrawals'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 md:flex-none md:px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all tracking-wider whitespace-nowrap ${activeTab === tab
                ? 'border-2 border-primary text-primary bg-primary/5'
                : 'text-slate-500 hover:text-primary'
                }`}
            >
              {tab === 'overview' && ' Tổng quan'}
              {tab === 'vendors' && ' Hạng nhà cung cấp'}
              {tab === 'users' && ' Người dùng'}
              {tab === 'orders' && ' Đơn hàng'}
              {tab === 'disputes' && ' khiếu nại'}
              {tab === 'withdrawals' && ' Quản lý rút tiền'}
              {tab === 'content' && ' Nội dung'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">receipt_long</span>
                Đơn hàng gần đây
              </h2>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-ritual-bg rounded-xl border border-gold/10 hover:border-primary transition-all">
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-gold tracking-widest mb-1">{order.id}</p>
                      <p className="font-bold text-primary">{order.customer} → {order.vendor}</p>
                      <p className="text-xs text-slate-500 mt-1">{order.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary tracking-tight mb-2">{order.amount.toLocaleString()}₫</p>
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg ${order.status === 'Hoàn tất' ? 'bg-green-100 text-green-700' :
                        order.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8 text-center hover:shadow-lg transition-all">
                <span className="material-symbols-outlined text-5xl text-gold mb-4 block">verified_user</span>
                <h3 className="font-bold text-primary mb-2">Xác minh nhà cung cấp</h3>
                <p className="text-xs text-slate-500 mb-4">{pendingVendors.length} chờ xử lý</p>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Xem ngay
                </button>
              </div>

              <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8 text-center hover:shadow-lg transition-all">
                <span className="material-symbols-outlined text-5xl text-gold mb-4 block">warning</span>
                <h3 className="font-bold text-primary mb-2">khiếu nại</h3>
                <p className="text-xs text-slate-500 mb-4">{disputes.length} cần xử lý</p>
                <button
                  onClick={() => setActiveTab('disputes')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Xem ngay
                </button>
              </div>

              <div className="bg-primary/10 p-8 rounded-[2rem] border border-primary/20 text-center">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">settings</span>
                <h3 className="font-bold text-primary mb-2">Cài đặt hệ thống</h3>
                <p className="text-xs text-slate-600 mb-4">Quản lý cấu hình toàn cục</p>
                <button className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all">
                  Truy cập
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gold/10 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Hạng nhà cung cấp</h2>
                <p className="text-sm text-slate-500 mt-1">Quản lý và thiết lập các hạng thành viên cho đối tác</p>
              </div>
              <button 
                onClick={handleCreateVendorTier}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase hover:bg-slate-800 transition-all border border-primary/50 shadow-lg shadow-black/20 active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Thêm hạng mới
              </button>
            </div>

            <div className="overflow-x-auto">
              {isLoadingTiers ? (
                <div className="p-12 text-center text-slate-500">Đang tải danh sách hạng...</div>
              ) : tiersError ? (
                <div className="p-12 text-center text-red-500">{tiersError}</div>
              ) : vendorTiers.length === 0 ? (
                <div className="p-12 text-center text-slate-500">Chưa có hạng nhà cung cấp nào.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-ritual-bg border-b border-gold/10">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Tên hạng</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Hoa hồng (%)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Đơn hàng tối thiểu</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Doanh thu tối thiểu</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Rating tối thiểu</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorTiers.map((tier) => (
                      <tr key={tier.tierId} className="border-b border-gold/10 hover:bg-ritual-bg transition-all">
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{tier.tierId}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${tier.tierName === 'Bạc' ? 'bg-slate-100 text-slate-600' :
                              tier.tierName === 'Vàng' ? 'bg-yellow-100 text-yellow-700' :
                                tier.tierName === 'Kim Cương' ? 'bg-blue-100 text-blue-700' :
                                  'bg-primary text-white'
                            }`}>
                            {tier.tierName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-primary font-bold">{tier.commissionRate}%</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{tier.minCompletedOrders}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{tier.minRevenueAmount} triệu</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{tier.minRatingAvg} ⭐</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${tier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {tier.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditVendorTier(tier.tierId)}
                              className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                              title="Chỉnh sửa / Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-sm">edit_note</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteVendorTier(tier.tierId, tier.tierName)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gold/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary">Quản Lý Người Dùng</h2>
                <p className="text-sm text-slate-500 mt-1">Danh sách Admin và Staff trong hệ thống</p>
              </div>
              <button
                onClick={handleCreateUser}
                disabled={isCreatingUser}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm uppercase hover:opacity-90 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Thêm Admin/Staff
              </button>
            </div>

            <div className="p-8 bg-ritual-bg/50 border-b border-gold/10 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Lọc theo vai trò</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gold/10 bg-white"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Customer">Customer</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gold/10 bg-white"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Active">Đang hoạt động (Active)</option>
                  <option value="Inactive">Ngừng hoạt động (Inactive)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingUsers ? (
                <div className="p-12 text-center text-slate-500">Đang tải danh sách người dùng...</div>
              ) : usersError ? (
                <div className="p-12 text-center text-red-500">{usersError}</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-slate-500">Chưa có người dùng nào.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-ritual-bg border-b border-gold/10">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600 w-16">Ảnh</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Họ và tên</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Số điện thoại</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Vai trò</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userId} className="border-b border-gold/10 hover:bg-ritual-bg transition-all">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-full bg-ritual-bg border border-gold/10 overflow-hidden flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-gold/30">person</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-primary">{user.fullName || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4 text-slate-600">{user.phoneNumber || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map(role => (
                              <span key={role} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                role === 'Staff' ? 'bg-blue-100 text-blue-700' :
                                  role === 'Vendor' ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewUserDetail(user.userId)}
                            className="px-3 py-1 border border-primary text-primary rounded-lg text-xs font-bold hover:bg-primary/5 transition-all"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-primary">Xử lý hoàn tiền</h2>
                <p className="text-sm text-slate-500 mt-1">Duyệt hoặc từ chối yêu cầu hoàn tiền của khách hàng.</p>
              </div>
              <button
                onClick={loadRefundRequests}
                className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
              >
                Tải lại
              </button>
            </div>

            {isLoadingRefunds && (
              <div className="text-center py-10 text-slate-500">Đang tải danh sách hoàn tiền...</div>
            )}

            {refundsError && (
              <div className="text-center py-10 text-red-500">{refundsError}</div>
            )}

            {!isLoadingRefunds && !refundsError && refundRequests.length === 0 && (
              <div className="text-center py-10 text-slate-500">Chưa có yêu cầu hoàn tiền.</div>
            )}

            <div className="space-y-4">
              {refundRequests.map((refund) => (
                <div key={refund.refundId} className="p-6 bg-ritual-bg rounded-xl border border-gold/10 hover:border-primary transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-gold tracking-widest mb-1">#{refund.orderCode || refund.orderId.slice(0, 8)}</p>
                      <h3 className="text-lg font-bold text-primary mb-2">{refund.customerName}</h3>
                      <div className="flex gap-4 text-sm text-slate-600">
                        <span> {formatCurrencyVN(refund.refundAmount)}</span>
                        <span> {formatDateTimeVN(refund.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{refund.reason || 'Không có lý do'}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${getStatusTheme(refund.status)}`}>
                      {getDisplayStatus(refund.status)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gold/10">
                    <button
                      className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
                    >
                      Xem chi tiết
                    </button>
                    {refund.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApproveRefund(refund.refundId)}
                          disabled={processingRefundId === refund.refundId}
                          className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg font-bold text-sm hover:bg-green-50 transition-all disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectRefund(refund.refundId)}
                          disabled={processingRefundId === refund.refundId}
                          className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
              <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">image</span>
                Biểu ngữ & Nội dung
              </h3>
              <div className="space-y-4">
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  + Tạo biểu ngữ mới
                </button>
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  + Thêm sản phẩm nổi bật
                </button>
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  + Quản lý danh mục
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
              <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">tune</span>
                Cài đặt tài chính
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Hoa hồng sàn (%)</label>
                  <input type="number" defaultValue="10" className="w-full px-4 py-2 rounded-lg border border-gold/10 bg-ritual-bg" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Phí giao dịch (%)</label>
                  <input type="number" defaultValue="2.5" className="w-full px-4 py-2 rounded-lg border border-gold/10 bg-ritual-bg" />
                </div>
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gold/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Quản Lý Rút Tiền</h2>
                <p className="text-sm text-slate-500 mt-1">Theo dõi và duyệt các yêu cầu rút tiền từ nhà cung cấp</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold uppercase">
                  {getPendingCount()} chờ duyệt
                </span>
                <button
                  onClick={loadWithdrawalRequests}
                  className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-xs uppercase hover:bg-primary/5 transition-all"
                >
                  Tải lại
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingWithdrawals && (
                <div className="px-8 py-10 text-center text-slate-500 font-semibold">Đang tải dữ liệu rút tiền...</div>
              )}

              {!isLoadingWithdrawals && withdrawalsError && (
                <div className="px-8 py-10 text-center">
                  <p className="text-red-600 font-semibold mb-4">{withdrawalsError}</p>
                  <button
                    onClick={loadWithdrawalRequests}
                    className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {!isLoadingWithdrawals && !withdrawalsError && withdrawalRequests.length === 0 && (
                <div className="px-8 py-10 text-center text-slate-500 font-semibold">Chưa có yêu cầu rút tiền nào.</div>
              )}

              {!isLoadingWithdrawals && !withdrawalsError && withdrawalRequests.length > 0 && (
                <table className="w-full">
                  <thead>
                    <tr className="bg-ritual-bg border-b border-gold/10">
                      {/* <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Mã yêu cầu</th> */}
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Nhà cung cấp</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Số tiền</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Tài khoản nhận</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Thời gian</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gold/10 hover:bg-ritual-bg transition-all">
                        {/* <td className="px-6 py-4 font-bold text-primary">{request.id}</td> */}
                        <td className="px-6 py-4 text-slate-700 font-semibold">{request.vendor}</td>
                        <td className="px-6 py-4 text-primary font-black">{formatCurrencyVN(request.amount)}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{request.bank}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{formatDateTimeVN(request.requestedAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${getStatusTheme(request.status)}`}>
                            {getDisplayStatus(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewWithdrawalDetail(request)}
                              className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-xs hover:bg-primary/5 transition-all whitespace-nowrap"
                            >
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => handleApproveWithdrawal(request.id)}
                              disabled={processingWithdrawalId === request.id || isFinalWithdrawalStatus(request.status)}
                              className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg font-bold text-xs hover:bg-green-50 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(request.id)}
                              disabled={processingWithdrawalId === request.id || isFinalWithdrawalStatus(request.status)}
                              className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
