-- VAT on a refunded sale was never owed, so it needs a third state.
--
-- Previously the only options were PENDING and REMITTED. A refunded sale left
-- its VAT entry PENDING, where the finance overview kept counting it as money
-- the platform still had to remit to FIRS. Deleting the row would have fixed
-- the figure and lost the record, so the entry is kept and marked instead.
--
-- Adding a value only. Nothing reads or writes it until the refund action
-- does, so this is safe to apply ahead of the code.
ALTER TYPE "VatStatus" ADD VALUE 'REVERSED';
