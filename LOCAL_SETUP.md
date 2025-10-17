# 🚀 Локальный запуск PSIH CanvasDB

## Требования

- Node.js 18+ 
- Python 3.11+
- Git

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/Deseara/psih-canvasdb.git
cd psih-canvasdb
```

### 2. Установка зависимостей Frontend
```bash
cd frontend
npm install
cd ..
```

### 3. Запуск серверов

**Способ 1: В двух терминалах (рекомендуется)**

Терминал 1 - Backend:
```bash
cd backend
python3 http_server.py
```

Терминал 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Способ 2: В фоне (один терминал)**
```bash
# Запуск backend в фоне
cd backend && python3 http_server.py &

# Запуск frontend в фоне  
cd frontend && npm run dev &
```

### 4. Открыть приложение

- **Frontend**: http://localhost:5173 (или порт который покажет Vite)
- **Backend API**: http://localhost:8000

## Остановка серверов

```bash
# Остановить все процессы
pkill -f "http_server.py"
pkill -f "npm run dev"
```

## Проверка работы

1. Откройте http://localhost:5173
2. Должны увидеть 3 вкладки: Tables, Canvas, Views
3. На вкладке Tables - демо данные (Products, Inventory)
4. На вкладке Canvas - нажмите "Load Demo" для загрузки демо-графа

## Возможные проблемы

### Порт занят
```bash
# Проверить какие порты используются
lsof -i :5173
lsof -i :8000

# Убить процессы на портах
sudo kill -9 $(lsof -ti:5173)
sudo kill -9 $(lsof -ti:8000)
```

### Frontend не загружается
- Проверьте что Vite показал правильный порт
- Если показал другой порт (например 5175) - используйте его
- Обновите страницу (F5)

### API не работает
```bash
# Проверить что backend запущен
curl http://localhost:8000/api/tables

# Должен вернуть JSON с таблицами
```

### Ошибки CORS
- Убедитесь что frontend и backend запущены на правильных портах
- Backend настроен на CORS для http://localhost:5173

## Структура проекта

```
psih-canvasdb/
├── backend/
│   └── http_server.py      # Простой HTTP API сервер
├── frontend/
│   ├── src/
│   │   ├── pages/          # Страницы приложения
│   │   ├── components/     # UI компоненты
│   │   └── lib/           # API клиент
│   └── package.json
└── docker-compose.yml     # Docker конфигурация (опционально)
```

## Демо функции

1. **Tables** - просмотр и редактирование данных
2. **Canvas** - создание workflow с узлами:
   - TableNode - источник данных
   - FilterNode - фильтрация
   - JoinNode - объединение таблиц  
   - WebhookNode - отправка данных
3. **Views** - результаты выполнения workflow

---

**Готово!** 🎉 Приложение должно работать на http://localhost:5173
