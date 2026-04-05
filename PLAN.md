# Roadmap ฟีเจอร์เพื่อยกระดับโปรเจคให้ใกล้ `gogolot.com` แบบทำทีละเฟส

## Summary
- เป้าหมาย: ขยายระบบเดิมโดยคงแกน `admin / agent / customer` ไว้ และตีความ `customer` เป็น `member` ใน UX ใหม่
- แนวทางที่ล็อกแล้ว: เริ่มจาก `ฐานข้อมูล + โครงสร้างหวย` ก่อน แล้วค่อยไล่ทีละฟีเจอร์
- แผนนี้อิงจากฟีเจอร์ที่ผมเข้าดูได้จริงจากบัญชี `agent` และ `member` ที่คุณให้ ไม่รวมส่วนที่ต้องใช้สิทธิ์อื่นซึ่งไม่ได้เข้าถึง

## รายการฟีเจอร์ทั้งหมดที่ต้องเพิ่มจากเว็บต้นแบบ
### Shared Platform
- รองรับหวยหลายกลุ่ม: รัฐบาล, ต่างประเทศ, รายวัน, หุ้น, VIP, หวยเฉพาะกิจ
- มี `league/category`, `lottery`, `round/match` แยกชัด พร้อมเวลาเปิดรับ, ปิดรับ, สถานะ, countdown
- มีโปรไฟล์อัตราจ่ายหลายชุด และเปลี่ยนตามชนิดหวยได้
- มีการเปิด/ปิดชนิดเดิมพันรายหวย
- มีผลรางวัลหลายหวยหลายงวด พร้อมลิงก์ภายนอกสำหรับลุ้นผล
- มีข่าวประกาศ/announcement
- มี online status และ last active ของสมาชิก

### Member / Customer
- หน้า home แบบกระดานรวมทุกหวยที่เปิดอยู่
- หน้าแทงแบบ console: fast bet, สลับ 2 ตัว/3 ตัว, กลับเลข, เลขเบิ้ล, เคลียร์, ส่งรายการซื้อ
- มี bet memo / บันทึกช่วยจำ
- แยก `รายการโพย`, `รายการซื้อ`, `รายการยกเลิก`
- มีรายงานสมาชิก: สรุปยอดโพย, แพ้ชนะสุทธิ, สรุปงวดหวย, ผลรางวัล
- มีประวัติการเงิน

### Agent
- dashboard แบบสายงาน: เครดิต, หุ้น, จำนวนสมาชิก, สถานะใช้งาน
- wizard เพิ่มสมาชิกแบบหลายขั้น
- ตั้งเครดิตเริ่มต้น, หุ้น, owner %, keep %, ค่าคอมมิชชั่น, อัตราจ่าย
- ตั้งขั้นต่ำ/สูงสุด/สูงสุดต่อเลข
- เปิด/ปิดหวยและอัตราจ่ายรายสมาชิก
- keep setting / keep by lottery / blocked number หรือรายการเก็บของ-อั้น
- ดูสมาชิกออนไลน์
- รายงาน agent หลายแบบ: ของรวม, คาดคะเนได้เสีย, คาดคะเนกำไรขาดทุน, รอผลเดิมพัน, รายงานขาย, รายการถูกรางวัล, ผลรางวัลย้อนหลัง
- โอนเครดิต/เติมเงินภายในระบบ และประวัติการเงิน

## Public API / Interface Changes
- ขยาย `User` ให้รองรับ `parentUserId`, `displayRole`, `stockPercent`, `creditBalance`, `status`, `lastActiveAt`
- เพิ่ม model/collection ใหม่: `LotteryLeague`, `LotteryType`, `DrawRound`, `RateProfile`, `LimitProfile`, `UserLotteryConfig`, `BetSlip`, `BetItem`, `ResultRecord`, `CreditLedgerEntry`, `Announcement`
- เปลี่ยนแกนการอ้างอิงจาก `roundDate` เดียว ไปเป็น `roundId` ที่ผูกกับหวยและเวลาเปิด/ปิด
- เพิ่ม API namespace ใหม่:
  - `/api/catalog`
  - `/api/results`
  - `/api/member/bets`
  - `/api/member/slips`
  - `/api/member/reports`
  - `/api/agent/members`
  - `/api/agent/config`
  - `/api/agent/reports`
  - `/api/wallet`
- คง API เดิมไว้ชั่วคราวในช่วง migration แล้วค่อยลดบทบาทหลังหน้าใหม่พร้อมใช้

## Roadmap แบบทำทีละเฟส
### Phase 1: Foundation Data Model and Lottery Catalog
- Database: เพิ่ม `league`, `lottery`, `round`, `rate profile`, `user hierarchy` และสถานะเปิด/ปิด
- Backend: สร้าง catalog service, round-status resolver, selector APIs, adapter จาก schema เดิม
- Frontend: เพิ่ม state กลางสำหรับ `rate / lottery / round` และหน้า board แบบ read-only
- เป้าหมายเฟสนี้: ระบบเลือกชนิดหวยและงวดได้จริง โดยยังไม่ต้องแทง

### Phase 2: Member Betting Engine
- Database: เพิ่ม `BetSlip`, `BetItem`, `draft/memo`
- Backend: parser สำหรับ fast bet, helper กลับเลข/เลขเบิ้ล, validation ตาม config หวย, submit/list/cancel slip
- Frontend: หน้าแทงแบบ console, รายการโพย, รายการซื้อ, รายการยกเลิก
- เป้าหมายเฟสนี้: member แทงได้ตามหวยและงวดใหม่

### Phase 3: Result and Payout Engine
- Database: เพิ่มผลรางวัลต่อ round และ snapshot การคำนวณรางวัล
- Backend: import/manual result, payout calculator แบบ idempotent, pending/resolved state
- Frontend: หน้าผลรางวัล, สรุปงวดหวย, รายการถูกรางวัล, win/loss member
- เป้าหมายเฟสนี้: วงจรแทง -> ออกรางวัล -> คำนวณจบครบ

### Phase 4: Agent Member Management
- Database: เพิ่ม config สมาชิกรายคน เช่น credit, หุ้น, limit, rate profile, enabled lotteries
- Backend: API สำหรับ create/edit member แบบหลายขั้น, search/list/detail, online status
- Frontend: wizard เพิ่มสมาชิก, หน้าข้อมูลทั่วไป/เก็บของ, รายชื่อสมาชิก
- เป้าหมายเฟสนี้: agent บริหารสมาชิกได้ใกล้เว็บต้นแบบ

### Phase 5: Agent Risk and Price Controls
- Database: เพิ่ม keep settings, per-lottery keep settings, blocked-number rules
- Backend: config endpoints และ hook ตรวจ limit/keep/เปิดปิด ก่อนรับเดิมพัน
- Frontend: หน้าขั้นต่ำ/สูงสุด/สูงสุดต่อเลข, อัตราจ่าย/คอมมิชชั่น, เปิดปิดหวย/อัตราจ่าย, keep setting
- เป้าหมายเฟสนี้: agent คุมความเสี่ยงและการรับของได้จริง

### Phase 6: Agent Reports
- Database: ใช้ query aggregation ก่อน หากช้าแล้วค่อยเพิ่ม materialized summary
- Backend: รายงานของรวม, คาดคะเนได้เสีย, กำไรขาดทุน, pending bets, sales summary, winner report
- Frontend: หน้ารายงานทุกกลุ่มในเมนู agent
- เป้าหมายเฟสนี้: หลังบ้าน agent ใช้งานเชิงธุรกิจได้ครบ

### Phase 7: Credit Ledger
- Database: เพิ่ม ledger ธุรกรรมเครดิต และยอดคงเหลือที่ตรวจสอบย้อนหลังได้
- Backend: transfer/adjust/history APIs พร้อม rule ตรวจยอดคงเหลือ
- Frontend: เติมเครดิต/โอนเครดิต/ประวัติการเงิน
- เป้าหมายเฟสนี้: การเงินในระบบครบและ audit ได้

### Phase 8: Announcement, Presence, and Cleanup
- Database: announcements, read status, session heartbeat
- Backend: ข่าวประกาศ, read marker, online presence update
- Frontend: ข่าวในหน้า home, สมาชิกออนไลน์, เก็บงาน navigation และ UX ให้จบ
- เป้าหมายเฟสนี้: เก็บ parity ส่วนเสริมและ polish ระบบ

## Test Plan
- ผู้ใช้เดิมยัง login ได้หลังขยาย schema
- member เห็นเฉพาะหวยที่เปิดให้เล่นและอยู่ในเวลารับเดิมพัน
- ระบบปฏิเสธ bet เมื่อปิดรับ, เกิน limit, หรือถูก block
- helper `กลับเลข` และ `เลขเบิ้ล` สร้างรายการเดิมพันถูกต้อง
- cancel ใช้ได้เฉพาะภายในเวลาที่กำหนด
- คำนวณผลรางวัลรอบเดิมซ้ำแล้วผลไม่เพี้ยน
- การเปลี่ยน rate/limit/keep ของ agent มีผลกับเดิมพันใหม่ ไม่ย้อนแก้ของเก่า
- รายงานรวมตรงกับข้อมูลจาก slip/item จริง
- ธุรกรรมเครดิตทุกครั้งทำให้ balance ตรงและ trace ย้อนหลังได้

## Assumptions and Defaults
- ใช้ stack เดิมต่อ: `Node.js + Express + MongoDB + React + Vite`
- `admin` ยังคงเป็น role คุมระบบของเว็บคุณ ไม่ย้ายไปตาม role model ของเว็บต้นแบบทั้งหมด
- `customer` จะถูกยกระดับเป็น `member experience` โดยไม่รีบเปลี่ยน enum role ทันที
- ระบบการเงินใน roadmap นี้หมายถึง `internal credit ledger` ยังไม่รวม payment gateway จริง
- งานจะทำทีละเฟสแบบ backward-compatible ไม่ย้ายทุกอย่างในครั้งเดียว
- ดีไซน์หน้าตาใช้ของเว็บคุณเอง เอาเฉพาะ logic และ workflow จากเว็บต้นแบบ
