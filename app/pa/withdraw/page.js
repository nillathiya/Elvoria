import DepositMethods from "@/app/components/DepositMethods";

// mode="withdraw" so this never creates a deposit request or shows a receiving
// address — those are for money coming IN. Withdrawal is not part of the
// current spec.
export default function WithdrawPage() {
  return <DepositMethods title="Withdrawal" action="Withdraw" mode="withdraw" />;
}
