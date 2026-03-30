export const memberCopy = {
  overview: {
    heroEyebrow: 'กระดานตลาดหวย',
    heroTitle: 'เลือกตลาดที่ต้องการซื้อ',
    heroSubtitle: 'ดูตลาดที่กำลังเปิดรับ เช็กเวลาในงวด เปรียบเทียบเรท และเข้าไปหน้าแทงได้จากหน้าหลักเดียว',
    marketCount: (count) => `${count} ตลาด`,
    openCount: (count) => `เปิดรับ ${count} ตลาด`,
    countdown: (value) => `นับถอยหลัง ${value}`,
    cta: 'ไปหน้าแทง',
    stats: {
      selectedMarket: 'ตลาดที่เลือก',
      currentRound: 'งวดปัจจุบัน',
      rateProfile: 'โปรไฟล์เรท',
      status: 'สถานะ',
      noProviderSelected: 'ยังไม่ได้เลือกผู้ให้บริการ',
      noRoundLoaded: 'ยังไม่มีข้อมูลงวด',
      supportedBetTypes: (count) => `รองรับ ${count} ประเภทเดิมพัน`,
      selectMarketHint: 'เลือกตลาดเพื่อดูรายละเอียดเพิ่มเติม'
    },
    announcements: {
      eyebrow: 'กระดานประกาศ',
      title: 'ประกาศล่าสุด',
      markRead: 'ทำเครื่องหมายว่าอ่านแล้ว',
      read: 'อ่านแล้ว'
    },
    selectedMarket: {
      eyebrow: 'ตลาดที่เลือก',
      round: 'งวด',
      close: 'ปิดรับ',
      draw: 'ออกรางวัล',
      betType: 'ประเภทเดิมพัน',
      rate: 'เรทจ่าย'
    },
    cards: {
      noRound: 'ยังไม่มีงวด',
      waitingForData: 'รอข้อมูลตลาด',
      close: 'ปิดรับ',
      countdown: 'นับถอยหลัง',
      baseRate: 'เรทเริ่มต้น',
      latestResult: 'ผลล่าสุด',
      noResultYet: 'ยังไม่มีผล',
      supportedBetTypes: (count) => `รองรับ ${count} ประเภทเดิมพัน`
    }
  },
  bet: {
    heroEyebrow: 'หน้าซื้อหลัก',
    heroTitle: 'คอนโซลแทงหวย',
    heroSubtitle: 'เลือกตลาด เลือกงวด ใส่โพยแบบเร็ว ดูตัวอย่าง แล้วค่อยบันทึกหรือส่งซื้อจริงในจอเดียว',
    loadRoundsError: 'โหลดงวดไม่สำเร็จ',
    selectLotteryAndRound: 'กรุณาเลือกหวยและงวดก่อน',
    previewError: 'สร้างตัวอย่างโพยไม่สำเร็จ',
    createSlipError: 'สร้างโพยไม่สำเร็จ',
    draftSaved: (slipNumber) => `บันทึกโพย ${slipNumber} แล้ว`,
    submitted: (slipNumber) => `ส่งรายการซื้อ ${slipNumber} แล้ว`,
    helperDoubleSet3: 'เปิดเลขเบิ้ล 3 ตัว',
    helperDoubleSet2: 'เปิดเลขเบิ้ล 2 ตัว',
    helperExtra: 'เปิดตัวช่วย',
    helperDefault: 'เพิ่มเลขเบิ้ล',
    lotteryField: 'ตลาดหวย',
    roundField: 'งวด',
    rateChip: (rateProfileName) => `เรท ${rateProfileName || '-'}`,
    defaultAmount: 'จำนวนมาตรฐาน',
    memoField: 'บันทึกช่วยจำ',
    fastInput: 'กรอกโพยแบบเร็ว',
    presetsSuffix: 'บาท',
    reverse: 'กลับเลข',
    clearAll: 'ล้างทั้งหมด',
    helperNote: 'รองรับรูปแบบ `123 10`, `123=10`, `123/10` หรือพิมพ์เลขอย่างเดียวแล้วใช้จำนวนมาตรฐานด้านบน',
    memoPlaceholder: 'เช่น โพยเช้า หรือเลขเน้น',
    previewEyebrow: 'ตัวอย่างโพย',
    previewTitle: 'ตรวจรายการก่อนส่ง',
    previewButton: 'รีวิวโพย',
    previewEmpty: 'กดรีวิวโพยเพื่อดูรายการที่ระบบสร้างให้ก่อนบันทึกหรือส่งซื้อ',
    previewStats: {
      itemCount: 'จำนวนรายการ',
      totalAmount: 'ยอดแทง',
      potentialPayout: 'จ่ายสูงสุด',
      roundStatus: 'สถานะงวด'
    },
    previewLimitNotice: (count) => `ตอนนี้แสดง 12 รายการแรกจากทั้งหมด ${count} รายการ`,
    saveDraft: 'บันทึกโพย',
    savingDraft: 'กำลังบันทึก...',
    submit: 'ส่งรายการซื้อ',
    submitting: 'กำลังส่ง...',
    submitWarning: 'งวดนี้ยังไม่เปิดรับซื้อ จึงยังส่งโพยไม่ได้'
  },
  history: {
    tabs: {
      draft: 'โพยร่าง',
      submitted: 'รายการซื้อ',
      cancelled: 'โพยยกเลิก'
    },
    loadError: 'โหลดประวัติโพยไม่สำเร็จ',
    cancelSuccess: 'ยกเลิกโพยแล้ว',
    cancelError: 'ยกเลิกโพยไม่สำเร็จ',
    heroEyebrow: 'ไทม์ไลน์โพย',
    heroTitle: 'ประวัติโพย',
    heroSubtitle: 'ดูโพยร่าง รายการซื้อ และโพยที่ยกเลิกจากระบบโพยใหม่ได้ในหน้าจอเดียว',
    cta: 'สร้างโพยใหม่',
    empty: 'ยังไม่มีโพยในหมวดนี้',
    emptyCta: 'ไปหน้าแทงหวย',
    stats: {
      itemCount: 'จำนวนรายการ',
      totalAmount: 'ยอดแทง',
      totalWon: 'ยอดถูก',
      pending: 'รอผล'
    },
    cancelSlip: 'ยกเลิกโพย'
  },
  summary: {
    heroEyebrow: 'สรุปผลการเล่น',
    heroTitle: 'สรุปผล',
    heroSubtitle: 'ดูผลสุทธิ ยอดแทงรวม และผลงานแยกตามงวดได้ในภาพรวมเดียว',
    netResult: 'ผลสุทธิ',
    stats: {
      totalBets: 'จำนวนรายการแทง',
      totalBetsHint: 'นับจากระบบโพยใหม่ทั้งหมด',
      totalAmount: 'ยอดแทงรวม',
      totalAmountHint: 'ยอดเงินที่ส่งซื้อทั้งหมด',
      totalWon: 'ยอดถูกรวม',
      totalWonHint: 'ยอดจ่ายที่ตัดเข้าระบบแล้ว'
    },
    panelEyebrow: 'แยกตามงวด',
    panelTitle: 'สรุปรายงวด',
    empty: 'ยังไม่มีข้อมูลสรุปในตอนนี้',
    fallbackMarketName: 'ตลาดหวย',
    betCount: (count) => `${count} รายการ`,
    stake: (amount) => `ยอดแทง ${amount} ฿`
  },
  results: {
    heroEyebrow: 'ฟีดผลรางวัล',
    heroTitle: 'ผลรางวัลล่าสุด',
    heroSubtitle: 'ติดตามผลรางวัลล่าสุดของทุกตลาดที่ซิงก์เข้าระบบแล้วจากหน้ารวมเดียว',
    featured: {
      threeTop: '3 ตัวบน',
      twoBottom: '2 ตัวล่าง',
      source: 'แหล่งข้อมูล'
    },
    empty: 'ยังไม่มีผลรางวัลที่เผยแพร่ในตอนนี้',
    panelEyebrow: 'ฟีดแต่ละตลาด',
    table: {
      round: 'งวด',
      headline: 'ผลเด่น',
      threeTop: '3 ตัวบน',
      twoBottom: '2 ตัวล่าง',
      source: 'แหล่งข้อมูล'
    }
  },
  wallet: {
    heroEyebrow: 'ภาพรวมสมุดเครดิต',
    heroTitle: 'กระเป๋าเครดิต',
    heroSubtitle: 'ดูยอดคงเหลือ เครดิตเข้าออก และรายการเคลื่อนไหวทั้งหมดของบัญชีนี้ได้จากที่เดียว',
    currentBalance: 'ยอดคงเหลือปัจจุบัน',
    transactionCount: (count) => `มีประวัติในสมุดเครดิต ${count} รายการ`,
    stats: {
      creditIn: 'เครดิตเข้า',
      creditInHint: 'ยอดรับเครดิตสะสม',
      creditOut: 'เครดิตออก',
      creditOutHint: 'ยอดใช้หรือโอนออกสะสม',
      netFlow: 'สุทธิ',
      netFlowHint: 'ความเคลื่อนไหวสุทธิของเครดิต'
    },
    panelEyebrow: 'ฟีดสมุดเครดิต',
    panelTitle: 'รายการเคลื่อนไหว',
    empty: 'ยังไม่มีความเคลื่อนไหวกระเป๋าในตอนนี้',
    balanceAfter: (amount) => `คงเหลือ ${amount}`
  }
};

