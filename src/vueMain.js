const vueContent = {
    template: `
        <main>
            <div v-if="scr == 'settings'">
                <button @click="scr='main'">닫기</button>
                <button @click="backup">백업 및 복원</button>
                <textarea v-if="backupdata" v-model="backupdata"></textarea>
                <button v-if="backupdata" @click="restore">복원</button>
                <br>
                <input type="text" v-model="input.newAccName" placeholder="계정명">
                <input type="text" v-model="input.newAccUnit" placeholder="단위">
                <input type="number" v-model.number="input.newAccAmount" placeholder="초기잔액">
                <input type="number" v-model.number="input.newAccCurrency" placeholder="적용환율" step="0.01">
                <button @click="addAccount">계정 추가</button>
                <div v-for="(a,adx) in master.acc" :key="adx">
                    <input type="text" v-model="master.acc[adx].acn" placeholder="계정명">
                    <input type="text" v-model="master.acc[adx].unt" placeholder="단위">
                    <input type="number" v-model.number="master.acc[adx].amt" placeholder="초기잔액">
                    <input type="number" v-model.number="master.acc[adx].cur" placeholder="적용환율" step="0.01">
                    <button @click="refresh">계정 수정</button>
                    <br>
                </div>
                <div>
                    <select v-model="input.transSend">
                        <option v-for="(a,adx) in master.acc" :value="adx" :key="adx">{{a.acn}}</option>
                    </select>
                    -->
                    <select v-model="input.transRecv">
                        <option v-for="(a,adx) in master.acc" :value="adx" :key="adx">{{a.acn}}</option>
                    </select>
                    <input type="number" v-model.number="input.transAmount" placeholder="송금액">
                    <button @click="transferAccount">계정간 송금</button>
                </div>
            </div>
            <div v-if="scr == 'main'">
                <div id="header">
                    <div class="content">
                        <button class="content" @click="scr='settings'">★ T T B ★</button>
                    </div>
                    <div class="content">
                        <div v-for="(a,adx) in master.acc" :key="adx" class="accbox" @click="input.newTrxAcc = adx">
                            <span :class="input.newTrxAcc==adx ? 'selected' : ''">{{a.acn}}</span>
                            <span style="text-align: center;">{{sumBank(adx).toLocaleString()}} {{a.unt}}</span>
                            <span style="text-align: right;">약 {{(sumBank(adx) * a.cur).toLocaleString()}} 원</span>
                        </div>
                    </div>
                    <div v-if="input.newTrxAcc !== null" id="new-trx-form" class="content">
                        <input type="datetime-local" v-model="input.newTrxTime">
                        <div>
                            <select v-model="input.newTrxKind">
                                <option v-for="k in Object.keys(preset.kind)" :value="k" :key="k">{{preset.kind[k]}}</option>
                            </select>
                            <input type="text" v-model="input.newTrxName" placeholder="이름">
                        </div>
                        <div style="text-align: right;">
                            <input type="number" class="big-number" v-model.number="input.newTrxAmount" placeholder="금액">
                            {{master.acc[input.newTrxAcc] ? master.acc[input.newTrxAcc].unt : ''}}
                        </div>
                        <button @click="addTransaction">거래 추가</button>
                    </div>
                    <select class="content" v-model="sortmethod" @change="sortTransaction">
                        <option value="amount">금액순</option>
                        <option value="time">시간순</option>
                    </select>
                    <input type="checkbox" v-model="sortorder" @change="sortTransaction">
                </div>
                <div id="trxbox-container">
                    <div v-for="(t,tdx) in master.trx" :key="tdx" class="trxbox" @dblclick="deleteTransaction(tdx)">
                        <div class="trxbox-left">
                            <span>{{t.tim}}</span>
                            <span>{{master.acc[t.acc].acn}}</span>
                            <span>{{preset.kind[t.knd]}}</span>
                        </div>
                        <div class="trxbox-right">
                            <span>{{t.trn}}</span>
                            <span class="big-number">{{t.amt.toLocaleString()}}</span>
                            <span>{{master.acc[t.acc].unt}}</span>
                            <span>({{(t.amt * master.acc[t.acc].cur).toLocaleString()}}원)</span>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="scr == 'reports'">
                <vue-pivottable :data="master.trx" aggregator-name="Sum" :rows="['knd']" :vals="['amt']"></vue-pivottable>
            </div>
        </main>
    `,
    el: '#screen',
    data: {
        backupdata: '',
        master: {
            acc: [],
            trx: []
        },
        input: {},

        scr: 'main',
        sortmethod: 'time',
        sortorder: true,

        preset: {
            kind: {"trs":"🚊 교통","tou":"🎡 관광","eat":"🍱 외식","snk":"🍙 간식","mrt":"🛒 마트","nec":"🧻 생필품","cls":"🛍️ 의류","svn":"🎁 기념품"}
        }
    },
    mounted() {
        const masterParse = JSON.parse(localStorage.getItem('master'))
        if (masterParse) {
            this.master = masterParse
        }
        this.refresh()
    },
    methods: {
        refresh() {
            this.sortTransaction()
            localStorage.setItem('master', JSON.stringify(this.master))
            this.input = {
                newAccName: '',
                newAccUnit: '',
                newAccAmount: 0,
                newAccCurrency: 1.0,
                newTrxTime: new Date(new Date().getTime()+32400000).toISOString().slice(0,16),
                newTrxKind: 'tou',
                newTrxName: '',
                newTrxAmount: 0,
                newTrxAcc: null,
                transSend: 0,
                transRecv: 1,
                transAmount: 0
            }
        },
        backup() {
            this.backupdata = JSON.stringify(this.master)
        },
        restore() {
            this.master = JSON.parse(this.backupdata)
            this.backupdata = ''
            this.refresh()
        },
        addAccount() {
            const newAcc = {
                acn: this.input.newAccName,
                unt: this.input.newAccUnit,
                amt: this.input.newAccAmount,
                cur: this.input.newAccCurrency
            }
            this.master.acc.push(newAcc)
            this.refresh()
        },
        transferAccount() {
            this.master.acc[this.input.transSend].amt -= this.input.transAmount
            this.master.acc[this.input.transRecv].amt += this.input.transAmount
            this.refresh()
        },
        addTransaction() {
            const newTrx = {
                tim: this.input.newTrxTime,
                knd: this.input.newTrxKind,
                trn: this.input.newTrxName,
                amt: this.input.newTrxAmount,
                acc: this.input.newTrxAcc
            }
            this.master.trx.push(newTrx)
            this.refresh()
        },
        deleteTransaction(index) {
            if (confirm(`정말로 ${this.master.trx[index].trn}를 삭제할까요?`)) {
                this.master.trx.splice(index, 1)
                this.refresh()
            }
        },
        sumBank(adx) {
            let sum = this.master.acc[adx].amt
            this.master.trx.forEach(t => {
                if (t.acc == adx) {
                    sum -= t.amt
                }
            })
            return sum
        },
        sortTransaction() {
            this.master.trx = Array.prototype.slice.call(this.master.trx).sort((a, b) => {
                return this.sortMethods(this.sortmethod, this.sortorder, a, b)
            })
        },
        sortMethods(method, desc, a, b) {
            switch(method) {
                case 'amount':
                    return (desc ? a.amt > b.amt : a.amt < b.amt) ? -1 : 1
                case 'time':
                    return (desc ? new Date(a.tim) > new Date(b.tim) : new Date(a.tim) < new Date(b.tim)) ? -1 : 1
            }
        }
    }
}
