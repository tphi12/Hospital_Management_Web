- Can thêm hàm updatePassword trong model User

- Socket io
```js
// Mỗi lần client kết nối đến server thì sẽ tạo ra một socket
const io = require('socket.io')(process.env.PORT || 3000, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});
``` 

- Bỏ io vào app luôn để dễ thực hiện qua fe
```js
app.set('io', io);
```
- Tải socket.io-client trong FE để kết nối đến server và thực hiện thông báo
```js
import { io } from 'socket.io-client';

const socket = io(process.env.BACKEND_URL || 'http://localhost:3000');
```