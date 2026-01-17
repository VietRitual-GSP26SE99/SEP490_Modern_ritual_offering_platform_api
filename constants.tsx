
import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cúng Đầy Tháng',
    category: 'Full Moon',
    price: 2500000,
    originalPrice: 2850000,
    image: 'https://docungcattuong.com/wp-content/uploads/2023/03/mam-cung-day-thang-be-gai-7.jpg',
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
    description: 'Trầu cau têm cánh phượng, chè trôi nước màu sắc, xôi gấc in chữ Phúc Lộc Thọ.',
    rating: 4.8,
    reviews: 92
  }
];
