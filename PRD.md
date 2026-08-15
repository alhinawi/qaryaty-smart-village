# Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** قريتي — Qaryati
**Type:** Smart Village Services Platform
**Platform:** Responsive Web Application
**Primary Language:** Arabic (RTL)
**Target Market:** Villages and rural communities in Egypt

### Product Vision

قريتي is a digital platform that connects village residents with local services, shops, professionals, delivery providers, education, care, and emergency services through one simple interface.

The goal is to make essential village services **discoverable, accessible, and orderable digitally**, while supporting local businesses and service providers.

---

# 2. Problem

Village residents often rely on:

- Word of mouth
- Phone calls
- Facebook/WhatsApp groups
- Local knowledge

to find services and providers.

This creates problems:

- Difficult service discovery
- Limited provider visibility
- No centralized service directory
- No standardized ratings
- Slow ordering
- Limited order tracking
- Poor digital presence for local businesses

---

# 3. Solution

Qaryati provides a unified local marketplace where users can:

1. Discover available village services.
2. Search and filter services.
3. Browse local shops.
4. Select a service provider/service.
5. Submit a service request.
6. Choose a payment method.
7. Receive an order number.
8. Track order progress.

## The initial prototype already represents this core journey through the Home experience, service filtering, service ordering modal, and order-success tracking flow.

# 4. Target Users

## Residents

People living in the village who need convenient access to local services.

Examples:

- Families
- Students
- Elderly residents
- Workers
- Parents

## Service Providers

Local individuals offering services such as:

- Plumbing
- Electrical work
- Carpentry
- Haircuts
- Home nursing
- Tutoring
- Delivery

## Local Shops

Businesses such as:

- Grocery stores
- Bakeries
- Vegetable sellers
- Fish shops
- Salons
- Workshops

---

# 5. Core User Journey

```text
Open Qaryati
      ↓
Splash Screen
      ↓
Home
      ↓
Search / Browse Categories
      ↓
Select Service
      ↓
Order Modal
      ↓
Enter Address + Phone + Details
      ↓
Select Payment Method
      ↓
Submit Order
      ↓
Order Confirmation
      ↓
Track Order
```

The current prototype implements the main ordering journey as a frontend demonstration.

---

# 6. Product Scope

## 6.1 Home

The home page is the main discovery surface.

It should contain:

- Header
- Village/location information
- Notifications
- Cart
- Search
- Hero section
- Platform statistics
- Categories
- Live order indicator
- Services
- Promotional banner
- Local shops
- Product/service advantages
- Bottom navigation

These sections are already represented in the current prototype.

---

# 7. Service Discovery

Users should be able to browse services by category.

### Categories

- الكل
- أكل وشرب
- توصيل
- حرف
- رعاية
- تعليم

The prototype currently supports category filtering and dynamically displays matching services.

### Search

Users can search services using:

- Service name
- Service description

Search results should update dynamically.

The current prototype implements this behavior.

---

# 8. Service Catalog

Initial service categories include examples such as:

### Food

- عيش من الفرن
- شوي سمك
- أكل بيتي

### Delivery

- سوبر ماركت
- رمي الزبالة
- خضار وفاكهة

### Crafts

- سباك
- نجار
- كهربائي
- حلاق

### Care

- توصيل المدرسة
- ممرضة منزلية
- خدمات مرتبطة برعاية الحيوانات/المنتجات المحلية

### Education

- مدرس خصوصي

The prototype currently contains 14 service entries.

---

# 9. Service Card Requirements

Each service card should display:

- Icon/emoji/image
- Service name
- Description
- Estimated time
- Price
- Rating
- Optional badge
- Featured state

Possible badges:

- الأكثر طلباً
- جديد

Clicking a service opens the ordering flow.

---

# 10. Local Shops

Users can browse village shops.

Each shop should display:

- Shop name
- Category/icon
- Open/closed status
- Opening hours
- Short description

Initial examples include:

- الحاج سيد
- فرن الأصيل
- خضار الفلاح
- صالون أبو العز
- عم صابر
- ورشة أبو خالد

These are represented in the current prototype.

---

# 11. Ordering

Users should be able to open an order request for a selected service.

### Required Fields

- Village address
- Phone number

### Optional Field

- Additional notes

### Payment Methods

- Cash on delivery
- Vodafone Cash
- InstaPay

The prototype currently uses these fields and payment options.

---

# 12. Order Validation

The system must prevent submission when required fields are missing.

Required:

- Address
- Phone

The user should receive a clear Arabic error message.

The current prototype performs this validation before creating the order.

---

# 13. Order Confirmation

After successful submission:

- Generate an order number.
- Display confirmation.
- Explain that a nearby provider is being located.
- Display tracking status.

Current tracking stages:

1. تم استلام الطلب
2. جاري إيجاد مزود قريب
3. في الطريق إليك
4. تم التسليم

The current prototype already represents these states visually.

---

# 14. Order Tracking

Future production functionality should allow users to track:

- Order status
- Assigned provider
- Estimated arrival
- Current delivery state

The current prototype is visual/demo-only and does not connect tracking to a backend.

---

# 15. Notifications

The application should support:

- New order notifications
- Order status updates
- Provider assignment
- Promotions
- Important village announcements

The prototype currently provides the notification entry point and demo toast behavior.

---

# 16. Cart

A cart entry exists in the current UI.

Future production functionality may support:

- Multiple shop items
- Quantity changes
- Cart total
- Delivery fees
- Checkout

The current prototype only exposes the cart UI and demo interaction.

---

# 17. Bottom Navigation

Primary navigation:

- الرئيسية
- طلباتي
- إضافة طلب
- رسائل
- حسابي

The central action should provide fast access to creating a service request.

---

# 18. User Account

Future account functionality should include:

- Profile
- Phone number
- Saved addresses
- Order history
- Favorite services
- Notifications
- Payment preferences

---

# 19. Provider Platform

A future provider experience should allow service providers to:

- Register
- Create a service profile
- Define pricing
- Set availability
- Receive requests
- Accept/reject orders
- Update order status
- View ratings
- View earnings

---

# 20. Shop Platform

Local businesses should be able to:

- Create shop profiles
- Add products/services
- Update prices
- Set opening hours
- Manage orders
- Receive customer reviews
- View basic sales information

---

# 21. Ratings & Reviews

Users should eventually be able to:

- Rate providers
- Rate shops
- Write reviews
- View average ratings
- Report inappropriate reviews

Ratings must be tied to completed orders where possible.

---

# 22. Emergency Services

Qaryati should support emergency access to services such as:

- Electrician
- Plumber
- Healthcare
- Emergency transportation

The current product messaging already positions emergency services as a core value proposition.

---

# 23. Value Proposition

Qaryati differentiates through:

### Convenience

Local services in one place.

### Speed

Fast local delivery and service discovery.

### Trust

Verified providers and ratings.

### Local Economy

Help village businesses reach more customers.

### Accessibility

Simple mobile-first UX designed for local residents.

The prototype explicitly communicates fast delivery, trusted providers, local pricing, live tracking, and 24/7 emergency services as core benefits.

---

# 24. Design Requirements

The product should preserve the current visual identity:

### Colors

- Primary green
- Dark green
- Gold
- Cream
- White

### Typography

- Cairo
- Tajawal

### Design Direction

- Friendly
- Local
- Modern
- Trustworthy
- Mobile-first
- Arabic-first

## The current prototype defines the core visual tokens and Arabic typography.

# 25. Responsive Requirements

The application must work across:

- 320px mobile
- 360px
- 375px
- 390px
- Tablet
- Desktop

The mobile experience is the primary design reference.

Must prevent:

- Overflow
- Clipping
- Overlapping
- Broken text wrapping
- RTL layout issues

---

# 26. Accessibility

The application should support:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible buttons
- Accessible forms
- Meaningful labels
- Proper RTL support

---

# 27. Technical Direction

### Frontend

Recommended:

- React
- TypeScript
- Vite initially

The architecture should remain portable to Next.js later.

### Future Production Stack

Potential direction:

- Next.js
- TypeScript
- PostgreSQL
- Authentication
- Server Actions/API
- Object storage
- Maps/location services
- Payment integration
- Notification infrastructure

These are future architectural directions, not requirements of the current prototype.

---

# 28. MVP

The first production MVP should focus on:

### Customer

- Browse services
- Search
- Filter by category
- View shops
- Create order
- Track order
- View order history
- Manage profile

### Provider

- Register
- Manage service
- Receive requests
- Accept orders
- Update status

### Platform

- Authentication
- Database
- Order management
- Provider management
- Ratings
- Notifications

---

# 29. Out of Scope for Initial Prototype

The current frontend prototype does not require:

- Real payments
- Real GPS tracking
- Real-time provider matching
- Backend authentication
- Production database
- Real notifications
- Provider dashboard
- Admin dashboard

These should be implemented only when moving from prototype to production.

---

# 30. Success Metrics

Future production success can be measured by:

- Number of registered users
- Number of active service providers
- Number of registered shops
- Orders per day
- Order completion rate
- Average time to provider assignment
- Average delivery/service time
- Customer rating
- Repeat order rate
- Monthly active users

---

# 31. Product Principles

1. **Local First**
   Optimize for real village needs.

2. **Simple First**
   Users should understand the interface without training.

3. **Trust First**
   Verification, reviews, and transparent information matter.

4. **Fast First**
   Reduce unnecessary steps between discovery and ordering.

5. **Mobile First**
   The primary experience is designed for phones.

6. **Scalable Architecture**
   Start simple but avoid architectural decisions that block future growth.

---

# 32. Current Product State

The existing project is a **frontend prototype**, not a production marketplace.

It already demonstrates the core visual experience and customer ordering flow, including splash screen, home discovery, filtering, service selection, ordering, confirmation, tracking visualization, and notifications/toasts.
The next stage is to convert the prototype into a clean React application while preserving the current product experience, then progressively introduce real data, authentication, backend services, providers, orders, and payments.
