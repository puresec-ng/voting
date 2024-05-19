import { BigNumber } from 'bignumber.js'
import Button, { ButtonProps, SecondaryButton } from '@components/Button'
import BN from 'bn.js'
import useUserGovTokenAccountQuery from '@hooks/useUserGovTokenAccount'
import { useDepositCallback } from './GovernancePower/Power/Vanilla/useDepositCallback'
import useWalletOnePointOh from '@hooks/useWalletOnePointOh'
import Modal from './Modal'
import { useState, useEffect } from 'react'
import useGoverningTokenMint from '@hooks/selectedRealm/useGoverningTokenMint'
import { useMintInfoByPubkeyQuery } from '@hooks/queries/mintInfo'
import Input from './inputs/Input'
import Loading from './Loading'

export const DepositTokensButton = ({
  role,
  as = 'secondary',
  ...props
}: { role: 'community' | 'council'; as?: 'primary' | 'secondary' } & Omit<
  ButtonProps,
  'onClick' | 'tooltipMessage'
>) => {
  const wallet = useWalletOnePointOh()
  const connected = !!wallet?.connected

  const userAta = useUserGovTokenAccountQuery(role).data?.result
  const depositAmount = userAta?.amount
    ? new BigNumber(userAta.amount.toString())
    : new BigNumber(0)

  const hasTokensInWallet = depositAmount.isGreaterThan(0)
  const depositTooltipContent = !connected
    ? 'Connect your wallet to deposit'
    : !hasTokensInWallet
      ? "You don't have any governance tokens in your wallet to deposit."
      : undefined

  const ButtonToUse = as === 'primary' ? Button : SecondaryButton
  const [openModal, setOpenModal] = useState(false)
  const mint = useGoverningTokenMint(role)
  const mintInfo = useMintInfoByPubkeyQuery(mint).data?.result
  const [isLoading2, setIsLoading2] = useState(false)
  const humanReadableMax =
    mintInfo === undefined
      ? undefined
      : depositAmount.shiftedBy(-mintInfo.decimals).toNumber()

  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (humanReadableMax && humanReadableMax > 0)
      setAmount(humanReadableMax ? humanReadableMax.toString() : '')
  }, [humanReadableMax])

  const deposit = useDepositCallback(role)

  return (
    <>
      <ButtonToUse
        {...props}
        onClick={() => setOpenModal(true)}
        tooltipMessage={depositTooltipContent}
        disabled={!connected || !hasTokensInWallet || props.disabled}
      >
        Deposit
      </ButtonToUse>
      {openModal && (
        <Modal isOpen={openModal} onClose={() => setOpenModal(false)}>
          <div className="flex flex-col gap-y-4">
            <h2>Deposit tokens</h2>
            <label>
              Amount to deposit
              <span>
                &nbsp;-&nbsp;<a href="#" onClick={() => { setAmount(humanReadableMax ? humanReadableMax.toString() : '') }}>Max</a>
              </span>
            </label>
            <Input
              placeholder={humanReadableMax?.toString() + ' (max)'}
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value) }}
              max={humanReadableMax}
            />
            <Button
              onClick={async () => {
                if (mintInfo === undefined) throw new Error()
                // max is the placeholder, so deposit the maximum amount if no value is input
                const nativeAmount =
                  amount === ''
                    ? new BN(depositAmount.toString())
                    : new BN(
                      new BigNumber(amount)
                        .shiftedBy(mintInfo.decimals)
                        .toString()
                    )
                setIsLoading2(true);
                await deposit(nativeAmount)
                setIsLoading2(false)
                setOpenModal(false)
              }}
              disabled={humanReadableMax !== undefined && (parseFloat(amount) > humanReadableMax || parseFloat(amount) <= 0)}
            >
              {isLoading2 ? <Loading></Loading> : 'Confirm'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
