
import React from 'react';

const TrackingPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-gray-100 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">Đang thực hiện</span>
                <span className="text-slate-400 font-mono text-sm">#MRT-8829-2024</span>
            </div>
            <h1 className="text-3xl font-black text-primary font-display italic">Mâm Cúng Đầy Tháng Đặc Biệt</h1>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giao hàng dự kiến</p>
            <p className="text-3xl font-black text-primary">12:45 Hôm nay</p>
        </div>
      </div>

      <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-xl border border-gray-200 mb-12 overflow-hidden relative">
        <div className="relative flex justify-between">
            <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
            <div className="absolute top-5 left-0 w-2/3 h-1 bg-primary rounded-full"></div>
            
            {[
                { label: 'Xác nhận', time: '10:15' },
                { label: 'Chuẩn bị', time: '11:30' },
                { label: 'Đang giao', time: 'Đang đi', active: true },
                { label: 'Hoàn tất', time: 'Dự kiến', disabled: true }
            ].map((step, i) => (
                <div key={i} className={`relative z-10 flex flex-col items-center text-center w-24 ${step.disabled ? 'opacity-30' : ''}`}>
                    <div className={`size-12 rounded-full flex items-center justify-center mb-4 ring-8 ring-white font-bold ${step.active ? 'bg-primary text-white animate-pulse' : (step.disabled ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white')}`}>
                        {i + 1}
                    </div>
                    <span className={`text-sm font-bold ${step.active ? 'text-primary' : 'text-slate-900'}`}>{step.label}</span>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{step.time}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-lg h-[400px] relative">
                <div className="absolute inset-0 bg-slate-200 grayscale opacity-40 bg-cover bg-center" style={{ backgroundImage: 'url("https://picsum.photos/1200/800?grayscale")' }} />
                <div className="absolute top-1/2 left-1/3 size-4 bg-primary rounded-full animate-ping" />
                <div className="absolute top-1/2 left-1/3 size-4 bg-primary rounded-full ring-4 ring-primary/20" />
                
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-full bg-cover border-2 border-gray-400 shadow-md" style={{ backgroundImage: 'url("https://picsum.photos/200/200?random=50")' }} />
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tài xế</p>
                            <p className="text-lg font-black text-primary">Minh Đức</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg font-bold">📞</button>
                        <button className="size-12 rounded-full bg-white border border-gray-300 text-primary flex items-center justify-center shadow-lg font-bold">💬</button>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Ảnh thực tế lễ vật</p>
                <div className="aspect-square rounded-2xl bg-cover mb-4 shadow-inner" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBd1fVba_9DmPaNbbw5FoIsRoBP7Vgfilu8tppWAUW5PuUvAvE6iguHCYzEBjYIz7N6oW1vaEt5GtV0TrI_L-D1u8D3VRJ8Zd0njPHRXddQp8poGUZwezYgOrUbvhv4ceXbykz5WztR3lcjz5e5CZ3c84KYSJtlJoyaLS3nJYffOZNCG1DQfOvkG4JDstRHb0h4g3RciAuH16b2kgJwVqcJ2eo0_AqojtkgtGcVoZqhRL9P58NPLSM9BQssYiPw2ilBsruzplwZ-jEg")' }} />
                <p className="text-xs text-slate-500 text-center italic">Đã kiểm tra chất lượng bởi Chuyên gia tại 11:35 AM</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200 text-center">
                <p className="text-sm font-bold text-primary mb-2">Cần hỗ trợ?</p>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.</p>
                <button className="w-full bg-white border border-gray-300 py-3 rounded-xl text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Liên hệ ngay</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
