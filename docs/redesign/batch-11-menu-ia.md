# Batch 11: menu consistency

Mobile menu uses one «المستعمل والتبادل» entry, matching home. Both existing sale/swap routes and the internal tab remain. Menu group titles now separate «الطلبات والفرص» from «مجتمع قريتي». Role permissions and staff entries unchanged. Existing menu unit tests updated and pass. Initial browser menu-to-market navigation worked but the swap-tab locator was incorrect; that full interaction is not yet counted as passed.

Additional QA on preceding cbf1b0a: at320/390/1440 controlled checkout blank address/phone shows both errors with zero createOrder calls; a valid local test form's controlled rejected order leaves the cart; retry with a local receipt navigates to orders, persists total57 and clears cart. No actual backend order or payment. This tests local UI integration, not server correctness or real previous-order retrieval.
