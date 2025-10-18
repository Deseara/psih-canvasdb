# 🔗 Webhooks и Триггеры

## Webhook - Прием данных с сайта

### Как использовать:

1. **Создайте таблицу** для приема данных (например, "orders")

2. **URL для webhook**:
```
POST http://localhost:8000/api/webhook/orders
```

3. **Отправьте данные** в формате JSON:
```json
{
  "customer_name": "Иван",
  "product": "Товар 1",
  "quantity": 2
}
```

### Пример с curl:
```bash
curl -X POST http://localhost:8000/api/webhook/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_name": "Иван", "product": "Товар 1", "quantity": 2}'
```

### Пример с JavaScript:
```javascript
fetch('http://localhost:8000/api/webhook/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_name: 'Иван',
    product: 'Товар 1',
    quantity: 2
  })
})
```

## Триггеры (в разработке)

Триггеры позволят автоматически:
- Проверять наличие товара на складе
- Отправлять уведомления
- Обновлять связанные таблицы
- Выполнять Canvas workflow

### Пример workflow:
1. Данные приходят через webhook → Таблица "Заказы"
2. Триггер проверяет → Таблица "Склад" (есть ли товар)
3. Если есть → Создает запись в "Отгрузка"
4. Если нет → Отправляет уведомление

## Связи между таблицами

Используйте тип поля **"Relation"** чтобы связать таблицы:

1. Создайте столбец типа "Relation"
2. Выберите связанную таблицу
3. При редактировании появится dropdown со списком записей

### Пример:
- Таблица "Заказы" → поле "customer" (Relation → "Клиенты")
- Таблица "Заказы" → поле "product" (Relation → "Товары")
