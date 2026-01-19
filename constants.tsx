
import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cúng Đầy Tháng',
    category: 'Full Moon',
    price: 2500000,
    originalPrice: 2850000,
    image: 'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-day-thang-be-gai-7.jpg',
    gallery: [
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-day-thang-be-gai-1.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-day-thang-be-gai-2.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-day-thang-be-gai-3.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-day-thang-be-gai-4.jpg',
    ],
    description: 'Bao gồm 13 bộ xôi chè, gà luộc cánh tiên, mâm quả ngũ sắc và bộ văn khấn đầy đủ.',
    rating: 4.9,
    reviews: 128,
    tag: 'Phổ biến'
  },
  {
    id: '2',
    name: 'Khai Trương',
    category: 'Grand Opening',
    price: 4950000,
    image: 'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-khai-truong-4-2.jpg',
    gallery: [
      'https://dichvumamcung.com/wp-content/uploads/2023/03/mam-cung-khai-trong-14-300x300.jpg',
      'https://dichvumamcung.com/wp-content/uploads/2023/03/mam-cung-khai-trong-10-300x300.jpg',
      'https://dichvumamcung.com/wp-content/uploads/2023/03/mam-cung-khai-trong-11-300x300.jpg',
      'https://dichvumamcung.com/wp-content/uploads/2023/03/mam-cung-khai-trong-12-300x300.jpg',
    ],
    description: 'Heo quay nguyên con, tháp bia, mâm ngũ quả lớn và bộ nhang đèn cao cấp.',
    rating: 5.0,
    reviews: 86,
    tag: 'VIP'
  },
  {
    id: '3',
    name: 'Tân Gia',
    category: 'House Warming',
    price: 1850000,
    image: 'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-nha-moi.jpg',
    gallery: [
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tan-gia-1.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tan-gia-2.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tan-gia-3.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tan-gia-4.jpg',
    ],
    description: 'Trầu cau têm cánh phượng, chè trôi nước màu sắc, xôi gấc in chữ Phúc Lộc Thọ.',
    rating: 4.8,
    reviews: 92
  },
  {
    id: '4',
    name: 'Cúng Giỗ',
    category: 'Ancestral',
    price: 3200000,
    image: 'https://cdn2.fptshop.com.vn/unsafe/800x0/mam_co_cung_gio_bac_2_e78468210f.png',
    gallery: [
      'https://cdn2.fptshop.com.vn/unsafe/800x0/mam_co_cung_gio_bac_2_e78468210f.png',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-gio-3.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-gio-4.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-gio-5.jpg',
    ],
    description: 'Gà luộc, thịt ba chỉ luộc, xôi gấc, chè đậu đen và mâm ngũ quả tươi.',
    rating: 4.9,
    reviews: 156,
    tag: 'Phổ biến'
  },
  // {
  //   id: '5',
  //   name: 'Cúng Tết',
  //   category: 'Year End',
  //   price: 4500000,
  //   image: 'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-1.jpg',
  //   gallery: [
  //     'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-2.jpg',
  //     'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-3.jpg',
  //     'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-4.jpg',
  //     'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-5.jpg',
  //   ],
  //   description: 'Bánh chưng, giò chả, thịt kho, dưa hành và mâm ngũ quả đầy đủ cho ngày Tết.',
  //   rating: 5.0,
  //   reviews: 203,
  //   tag: 'VIP'
  // },
  {
    id: '6',
    name: 'Cúng Tháng Bảy',
    category: 'Ancestral',
    price: 2800000,
    image: 'https://chuyengiaphongtho.com/wp-content/uploads/2025/08/cung-ram-thang-7-ngoai-troi-can-nhung-gi2.jpg',
    gallery: [
      'https://tiki.vn/blog/wp-content/uploads/2023/09/mam-cung-co-hon-hang-thang-1024x1024.jpg',
      'https://docungtamlinh.com.vn/wp-content/uploads/2023/08/cung-co-hon-thang-7-am-lich-2999k-vit-heo-quay-3.jpg',
      'https://bizweb.dktcdn.net/thumb/grande/100/246/544/products/15-a4631d59-b104-4d28-8301-d6e5cf12ffed.jpg?v=1720425925327',
      'https://dichvumamcung.com/wp-content/uploads/2025/06/mam-cung-co-hon-2.jpg',
    ],
    description: 'Cơm tấm, canh khổ qua, rau xào và các món chay thanh tịnh.',
    rating: 4.7,
    reviews: 78
  },
  {
    id: '7',
    name: 'Cúng Tết Nguyên Đán',
    category: 'Year End',
    price: 5200000,
    originalPrice: 5800000,
    image: 'https://file.hstatic.net/200000721249/file/mam_cung_tet_can_sach_se_fe68e9904d414f10a7bf9920378a3641.jpeg',
    gallery: [
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-nguyen-dan-2.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-nguyen-dan-3.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-nguyen-dan-4.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-tet-nguyen-dan-5.jpg',
    ],
    description: 'Mâm cúng Tết cao cấp với đầy đủ bánh chưng, giò lụa, thịt gà luộc và hoa quả tươi.',
    rating: 5.0,
    reviews: 142,
    tag: 'VIP'
  },
  {
    id: '8',
    name: 'Cúng Rằm Tháng Giêng',
    category: 'Full Moon',
    price: 3500000,
    image: 'https://hnm.1cdn.vn/2024/02/20/image.bnews.vn-mediaupload-org-2022-02-14-_co-5-20220214102512.jpg',
    gallery: [
      'https://hnm.1cdn.vn/2024/02/20/image.bnews.vn-mediaupload-org-2022-02-14-_co-5-20220214102512.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-ram-thang-gieng-3.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-ram-thang-gieng-4.jpg',
      'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-ram-thang-gieng-5.jpg',
    ],
    description: 'Xôi gấc, chè đậu đỏ, bánh trôi bánh chay và các loại trái cây tươi ngon.',
    rating: 4.8,
    reviews: 95
  }
];
