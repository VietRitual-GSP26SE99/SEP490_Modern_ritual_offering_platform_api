import React, { useEffect, useState } from 'react';
import { guidelineService, CulturalGuideline } from '../../services/guidelineService';

const CulturalGuidelinePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [guidelines, setGuidelines] = useState<CulturalGuideline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchGuidelines = async () => {
      try {
        const data = await guidelineService.getGuidelines();
        setGuidelines(data.filter(g => g.isActive));
      } catch (error) {
        console.error('❌ Failed to fetch guidelines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGuidelines();
  }, []);

  const getCategoryImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('thôi nôi')) return 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=1000&auto=format&fit=crop';
    if (n.includes('đầy tháng')) return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop';
    if (n.includes('động thổ')) return 'https://images.unsplash.com/photo-1541888941259-79273ceb3c32?q=80&w=1000&auto=format&fit=crop';
    if (n.includes('khai trương')) return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop';
    if (n.includes('tết') || n.includes('giao thừa')) return 'https://images.unsplash.com/photo-1596462502278-27bf3da32771?q=80&w=1000&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop';
  };

  const getCategorySubtitle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('thôi nôi')) return 'Kỷ niệm thiên thần nhỏ tròn 1 tuổi';
    if (n.includes('đầy tháng')) return 'Tạ ơn các Bà Mụ đã bao bọc bé';
    if (n.includes('động thổ')) return 'Xin phép Thổ Thần khởi công xây dựng';
    if (n.includes('khai trương')) return 'Hanh thông tài lộc, vạn sự như ý';
    if (n.includes('tết') || n.includes('giao thừa')) return 'Tạm biệt năm cũ, đón chào xuân sang';
    return 'Gìn giữ nét đẹp truyền thống';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2000&auto=format&fit=crop" 
            alt="Cultural Background" 
            className="w-full h-full object-cover brightness-[0.4]"
          />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black text-white italic mb-6 tracking-tighter drop-shadow-2xl">
            Cẩm Nang Văn Hóa <span className="text-primary italic">Tâm Linh</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-200 font-medium max-w-2xl mx-auto drop-shadow-lg leading-relaxed">
            Gìn giữ nét đẹp truyền thống Việt trong từng nghi lễ hiện đại. Hướng dẫn chi tiết cách chuẩn bị và thực hiện các lễ cúng chuẩn phong tục.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải kiến thức tâm linh...</p>
          </div>
        ) : guidelines.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">Hiện tại chưa có hướng dẫn nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {guidelines.map((item, index) => (
              <div 
                key={item.guidelineId} 
                onClick={() => onNavigate(`/cultural-guideline/${item.guidelineId}`)}
                className={`group flex flex-col bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 hover:shadow-primary/10 transition-all duration-500 border border-slate-100 animate-slide-up cursor-pointer`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative h-80 overflow-hidden">
                  <img 
                    src={getCategoryImage(item.categoryName)} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="inline-block px-4 py-1.5 bg-primary/90 text-white text-[10px] uppercase font-black tracking-widest rounded-full mb-3 backdrop-blur-sm">
                      {getCategorySubtitle(item.categoryName)}
                    </span>
                    <h2 className="text-3xl font-black text-white tracking-tight">{item.title}</h2>
                  </div>
                </div>
                
                <div className="p-10 flex-1 flex flex-col">
                  <p className="text-slate-600 leading-relaxed mb-8 text-lg italic line-clamp-3">
                    {item.description}
                  </p>
                  
                  <div className="space-y-4 mb-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <span className="w-10 h-0.5 bg-primary rounded-full"></span>
                      Hướng dẫn chi tiết
                    </h3>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic text-slate-500 text-sm leading-relaxed">
                      Nhấn để xem hướng dẫn bày biện mâm lễ và văn khấn thành tâm...
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(`/shop?category=${encodeURIComponent(item.categoryName)}`);
                      }}
                      className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl shadow-slate-200 hover:shadow-primary/20 active:scale-95"
                    >
                      Khám phá mâm cúng {item.categoryName}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Philosophy Section */}
      <section className="bg-slate-900 py-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-6 inline-block">Triết lý tâm linh</span>
          <h2 className="text-4xl md:text-5xl font-black text-white italic mb-10 tracking-tight leading-tight">
            "Không cần lễ vật mâm cao cỗ đầy, quan trọng nhất là tấm lòng thành kính."
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            Modern Ritual Offering ra đời với sứ mệnh giúp các gia đình hiện đại gánh vác phần nào sự lo toan trong khâu chuẩn bị lễ vật, để gia chủ có thể hoàn toàn tập trung vào sự thành tâm và niềm vui trong những ngày trọng đại.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="px-6 py-3 rounded-full border border-white/10 text-white font-bold text-sm backdrop-blur-sm">Thành Tâm</div>
            <div className="px-6 py-3 rounded-full border border-white/10 text-white font-bold text-sm backdrop-blur-sm">Chỉn Chu</div>
            <div className="px-6 py-3 rounded-full border border-white/10 text-white font-bold text-sm backdrop-blur-sm">Tiết Kiệm</div>
            <div className="px-6 py-3 rounded-full border border-white/10 text-white font-bold text-sm backdrop-blur-sm">Hiện Đại</div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Bạn cần tư vấn thêm về nghi lễ?</h2>
        <p className="text-slate-500 mb-10 max-w-lg mx-auto">Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn chuẩn bị một buổi lễ trọn vẹn nhất.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all">Gọi tư vấn: 1900 8888</button>
          <button 
            onClick={() => onNavigate('/about')}
            className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Về chúng tôi
          </button>
        </div>
      </section>
    </div>
  );
};

export default CulturalGuidelinePage;
