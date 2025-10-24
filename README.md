# 🚀 Space Altitude Game

Trò chơi arcade bắn tàu vũ trụ 2D theo phong cách pixel art với cơ chế độ cao độc đáo.

## 🎮 Mô tả Game

Người chơi điều khiển một chiếc tàu vũ trụ bay trong không gian, cần duy trì độ cao và đạt được 10 câu trả lời đúng liên tiếp để thắng.

### 🎯 Mục tiêu
- Đạt 10 câu trả lời đúng liên tiếp
- Duy trì độ cao > 0km
- Hoàn thành trong thời gian 2 phút

### 🕹️ Điều khiển
- **D** hoặc **↑**: Trả lời đúng (tăng độ cao +500km, điểm +1)
- **S** hoặc **↓**: Trả lời sai (giảm độ cao -1000km, reset điểm về 0)

### 📊 Cơ chế Game
- **Độ cao bắt đầu**: 10,000km
- **Trả lời đúng**: +500km độ cao, +1 điểm
- **Trả lời sai**: -1000km độ cao, reset điểm về 0
- **Điều kiện thắng**: 10 điểm liên tiếp + độ cao > 0km
- **Điều kiện thua**: Độ cao ≤ 0km hoặc hết thời gian

## 🛠️ Cài đặt và Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm start

# Build cho production
npm run build
```

## 🎨 Tính năng

- ✨ Giao diện pixel art với hiệu ứng vũ trụ
- 🎵 Animation mượt mà cho chuyển động tàu vũ trụ
- 📱 Responsive design
- 🎮 Điều khiển keyboard đơn giản
- 🏆 Hệ thống điểm số và thành tích
- ⏱️ Đồng hồ đếm ngược
- 🌟 Hiệu ứng visual cho độ cao

## 📁 Cấu trúc Project

```
src/
├── components/
│   ├── StartScreen.js/css      # Màn hình bắt đầu
│   ├── InstructionScreen.js/css # Màn hình hướng dẫn
│   ├── GameScreen.js/css       # Màn hình chơi chính
│   ├── GameOverScreen.js/css   # Màn hình thua
│   └── WinScreen.js/css        # Màn hình thắng
├── App.js                      # Component chính
├── App.css                     # Styles chung
└── index.js                    # Entry point
```

## 🎪 Screenshots

Game bao gồm 5 màn hình chính:
1. **Start Screen**: Màn hình chào mừng với thông tin game
2. **Instruction Screen**: Hướng dẫn cách chơi
3. **Game Screen**: Màn hình chơi chính với header/body/footer
4. **Win Screen**: Màn hình chúc mừng khi thắng
5. **Game Over Screen**: Màn hình khi thua

## 🚀 Công nghệ sử dụng

- React 18
- CSS3 với animations và gradients
- Responsive design
- Pixel art styling