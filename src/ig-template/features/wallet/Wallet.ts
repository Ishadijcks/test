import {Currency} from "./Currency";
import {CurrencyType} from "./CurrencyType";

import {SimpleEventDispatcher, ISimpleEvent} from "strongly-typed-events";
import {Feature} from "@/ig-template/features/Feature";
import {WalletSaveData} from "@/ig-template/features/wallet/WalletSaveData";


export class Wallet extends Feature {
    private _currencies: Record<CurrencyType, number> = {} as Record<CurrencyType, number>
    private _multipliers: Record<CurrencyType, number> = {} as Record<CurrencyType, number>

    private _onCurrencyGain = new SimpleEventDispatcher<Currency>();

    constructor() {
        super("wallet");

        // Initialize currencies and multipliers
        for (const type in CurrencyType) {
            this._currencies[type as CurrencyType] = 0;
            this._multipliers[type as CurrencyType] = 1;
        }
    }

    /**
     * Gain the specified currency and apply the global multiplier
     * @param currency
     */
    public gainCurrency(currency: Currency): void {
        currency.multiply(this.getCurrencyMultiplier(currency.type));

        if (!currency.isValid()) {
            console.warn(`Could not add currency ${currency.toString()}`);
            return;
        }

        this._onCurrencyGain.dispatch(currency);
        this._currencies[currency.type] += currency.amount;
    }

    public hasCurrency(currency: Currency): boolean {
        return this._currencies[currency.type] >= currency.amount;
    }

    /**
     * Remove the currency amount from the specified currency.
     * IMPORTANT: This method does not care if amounts go negative
     * @param currency
     */
    public loseCurrency(currency: Currency) {
        if (!currency.isValid()) {
            console.warn(`Could not lose currency ${currency.toString()}`);
            return;
        }
        this._currencies[currency.type] -= currency.amount;
    }

    /**
     * Subtracts the specified currency and returns true if the wallet has enough.
     * Otherwise return false and don't subtract anything
     * @param currency
     * @constructor
     */
    public payIfPossible(currency: Currency): boolean {
        if (this.hasCurrency(currency)) {
            this.loseCurrency(currency);
            return true;
        }
        return false;
    }

    /**
     * Return 1 if the multiplier is not set
     */
    public getCurrencyMultiplier(type: CurrencyType) {
        return this._multipliers[type] ?? 1;
    }

    public setCurrencyMultiplier(multiplier: number, type: CurrencyType) {
        this._multipliers[type] = multiplier;
    }

    public canAccess(): boolean {
        return true;
    }

    public save(): WalletSaveData {
        return {
            money: this._currencies[CurrencyType.Money],
            secondary: this._currencies[CurrencyType.Secondary],
        }
    }

    public load(data: WalletSaveData): void {
        this._currencies[CurrencyType.Money] = data.money ?? this._currencies[CurrencyType.Money];
        this._currencies[CurrencyType.Secondary] = data.secondary ?? this._currencies[CurrencyType.Secondary];
    }

    /**
     * Emitted whenever a currency is gained
     * @private
     */
    public get onCurrencyGain(): ISimpleEvent<Currency> {
        return this._onCurrencyGain.asEvent();
    }

}
