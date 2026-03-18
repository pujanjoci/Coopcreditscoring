/**
 * devtools.js — Quick-Fill Test Data Panel
 * Updated to match new questions.js field IDs (S.N 1–120 from official sheet)
 */

const TEST_PRESETS = {
    a_risk: {
        _label: 'A Risk — Excellent',
        _color: '#16a34a',
        // Section 1
        coop_name:                  'Himalayan Dairy Cooperative (Test)',
        years_operation:            15,
        office_location:            'Lalitpur, Bagmati',
        // Section 2
        existing_loan:              0,
        proposed_loan:              3000000,
        interest_rate:              9,
        loan_tenure:                60,
        installment_freq:           'Monthly',
        primary_land_value:         9000000,
        // Section 3
        milk_sales:                 42000000,
        other_product_sales:        3000000,
        other_income:               500000,
        grant_income:               200000,
        bank_sales:                 38000000,
        // Section 4
        total_buyers:               500,
        top5_buyers_sales:          10000000,
        largest_buyer_sales:        2500000,
        gov_buyer_sales:            8000000,
        no_govt_buyers:             3,
        large_private_buyer_sales:  20000000,
        no_private_sector_buyer:    5,
        small_buyer_sales:          500000,
        no_small_buyer_sales:       10,
        avg_collection_days:        20,
        contract_coverage:          8,
        // Section 5
        raw_milk_cost:              28000000,
        processing_cost:            0,
        packaging_cost:             0,
        other_processing_cost:      0,
        transport_cost:             600000,
        salary_expense:             2000000,
        admin_expense:              500000,
        electricity_expense:        300000,
        fuel_expense:               200000,
        repair_expense:             150000,
        rent_expense:               100000,
        other_opex:                 200000,
        lowest_monthly_expense:     250000,
        annual_depreciation:        800000,
        amortization_amount:        100000,
        // Section 6
        cash_hand:                  500000,
        bank_balance:               5000000,
        accounts_receivable:        800000,
        inventory_value:            600000,
        prepaid_expenses:           100000,
        other_current_assets:       200000,
        land_value:                 8000000,
        building_value:             3000000,
        machinery_value:            2500000,
        vehicle_value:              1500000,
        furniture_value:            300000,
        other_fixed_assets:         200000,
        // Section 7
        accounts_payable:           300000,
        short_term_loan:            0,
        accrued_expenses:           100000,
        current_ltd:                600000,
        long_term_loan:             2400000,
        other_ltl:                  0,
        // Section 8
        paid_up_capital:            5000000,
        retained_earnings:          4000000,
        reserve_fund:               2000000,
        // Section 9
        total_milk_collected:       4200000,
        milk_loss:                  42000,
        processing_loss:            0,
        avg_monthly_milk:           350000,
        lowest_monthly_milk:        310000,
        highest_monthly_milk:       420000,
        avg_inventory_value:        400000,
        credit_period_given_days:   7,
        top5_farmers_milk:          500000,
        highest_farmer_qty:         90000,
        lowest_farmer_qty:          1000,
        total_farmers:              700,
        collection_days:            355,
        // Section 10
        total_member_loans:         8000000,
        npa_member_loans:           80000,
        overdue_member_loans:       120000,
        restructured_loans_3yr:     'None',
        max_dpd_members:            10,
        credit_history_flag:        'Timely',
        // Section 11
        cash_last_year:             5500000,
        cash_prev_year:             4200000,
        audit_observations:         0,
        // Section 12
        mgmt_experience:            12,
        internal_control_score:     '85',
        loan_policy_compliance:     'Yes',
        vehicle_avail_pct:          'Yes',
        // Section 13
        storage_cold_facility:      'Yes',
        quality_sop_score:          '85',
        insurance_available:        'Yes',
        digital_mis_pos:            'Yes',
        regulatory_compliance:      'Yes',
        climatic_risk_score:        '2',
        // Section 14
        credit_history_bfi:         'Pass',
        max_dpd_bfi:                0,
        // Section 15
        meeting_frequency:          'Weekly',
        member_info_transparency:   'Always',
        fund_usage:                 'Buying Milk',
        kyc_aml:                    'Easily Found',
        income_expense_checked:     'Regularly',
        right_to_information:       'Always Beforehand',
        community_support_level:    'Significant',
        emergency_response:         'Proper Plan'
    },

    b_risk: {
        _label: 'B Risk — Solid',
        _color: '#2563eb',
        coop_name:                  'Terai Milk Cooperative (Test)',
        years_operation:            8,
        office_location:            'Chitwan, Bagmati',
        existing_loan:              500000,
        proposed_loan:              4000000,
        interest_rate:              10,
        loan_tenure:                60,
        installment_freq:           'Monthly',
        primary_land_value:         7000000,
        milk_sales:                 30000000,
        other_product_sales:        1500000,
        other_income:               300000,
        grant_income:               800000,
        bank_sales:                 22000000,
        total_buyers:               300,
        top5_buyers_sales:          12000000,
        largest_buyer_sales:        4000000,
        gov_buyer_sales:            5000000,
        no_govt_buyers:             2,
        large_private_buyer_sales:  15000000,
        no_private_sector_buyer:    4,
        small_buyer_sales:          800000,
        no_small_buyer_sales:       8,
        avg_collection_days:        35,
        contract_coverage:          5,
        raw_milk_cost:              20000000,
        processing_cost:            0,
        packaging_cost:             0,
        other_processing_cost:      0,
        transport_cost:             500000,
        salary_expense:             1500000,
        admin_expense:              400000,
        electricity_expense:        250000,
        fuel_expense:               180000,
        repair_expense:             120000,
        rent_expense:               100000,
        other_opex:                 300000,
        lowest_monthly_expense:     300000,
        annual_depreciation:        600000,
        amortization_amount:        50000,
        cash_hand:                  300000,
        bank_balance:               2900000,
        accounts_receivable:        1000000,
        inventory_value:            400000,
        prepaid_expenses:           80000,
        other_current_assets:       150000,
        land_value:                 6000000,
        building_value:             2000000,
        machinery_value:            1500000,
        vehicle_value:              1200000,
        furniture_value:            200000,
        other_fixed_assets:         150000,
        accounts_payable:           500000,
        short_term_loan:            500000,
        accrued_expenses:           150000,
        current_ltd:                800000,
        long_term_loan:             3200000,
        other_ltl:                  0,
        paid_up_capital:            3000000,
        retained_earnings:          2000000,
        reserve_fund:               1000000,
        total_milk_collected:       2800000,
        milk_loss:                  70000,
        processing_loss:            0,
        avg_monthly_milk:           233000,
        lowest_monthly_milk:        180000,
        highest_monthly_milk:       290000,
        avg_inventory_value:        300000,
        credit_period_given_days:   10,
        top5_farmers_milk:          560000,
        highest_farmer_qty:         70000,
        lowest_farmer_qty:          800,
        total_farmers:              450,
        collection_days:            340,
        total_member_loans:         5000000,
        npa_member_loans:           150000,
        overdue_member_loans:       200000,
        restructured_loans_3yr:     'Few Times',
        max_dpd_members:            35,
        credit_history_flag:        'With few delays',
        cash_last_year:             3200000,
        cash_prev_year:             2800000,
        audit_observations:         2,
        mgmt_experience:            7,
        internal_control_score:     '65',
        loan_policy_compliance:     'Yes',
        vehicle_avail_pct:          'Yes',
        storage_cold_facility:      'Yes',
        quality_sop_score:          '65',
        insurance_available:        'Yes',
        digital_mis_pos:            'Partial',
        regulatory_compliance:      'Partial',
        climatic_risk_score:        '5',
        credit_history_bfi:         'Pass',
        max_dpd_bfi:                0,
        meeting_frequency:          'Monthly',
        member_info_transparency:   'Mostly',
        fund_usage:                 'Buying Milk',
        kyc_aml:                    'Mostly',
        income_expense_checked:     'Regularly',
        right_to_information:       'Mostly Beforehand',
        community_support_level:    'Moderate',
        emergency_response:         'Ad-hoc'
    },

    c_risk: {
        _label: 'C Risk — Average',
        _color: '#d97706',
        coop_name:                  'Koshi Valley Cooperative (Test)',
        years_operation:            4,
        office_location:            'Morang, Koshi',
        existing_loan:              1500000,
        proposed_loan:              5000000,
        interest_rate:              12,
        loan_tenure:                48,
        installment_freq:           'Quarterly',
        primary_land_value:         5000000,
        milk_sales:                 18000000,
        other_product_sales:        500000,
        other_income:               200000,
        grant_income:               2500000,
        bank_sales:                 9000000,
        total_buyers:               150,
        top5_buyers_sales:          10000000,
        largest_buyer_sales:        5000000,
        gov_buyer_sales:            2000000,
        no_govt_buyers:             1,
        large_private_buyer_sales:  8000000,
        no_private_sector_buyer:    3,
        small_buyer_sales:          1000000,
        no_small_buyer_sales:       15,
        avg_collection_days:        55,
        contract_coverage:          2,
        raw_milk_cost:              13000000,
        processing_cost:            0,
        packaging_cost:             0,
        other_processing_cost:      0,
        transport_cost:             400000,
        salary_expense:             1200000,
        admin_expense:              350000,
        electricity_expense:        200000,
        fuel_expense:               150000,
        repair_expense:             100000,
        rent_expense:               80000,
        other_opex:                 250000,
        lowest_monthly_expense:     400000,
        annual_depreciation:        400000,
        amortization_amount:        30000,
        cash_hand:                  200000,
        bank_balance:               1300000,
        accounts_receivable:        1500000,
        inventory_value:            300000,
        prepaid_expenses:           50000,
        other_current_assets:       100000,
        land_value:                 4000000,
        building_value:             1200000,
        machinery_value:            800000,
        vehicle_value:              600000,
        furniture_value:            150000,
        other_fixed_assets:         100000,
        accounts_payable:           800000,
        short_term_loan:            1500000,
        accrued_expenses:           300000,
        current_ltd:                1000000,
        long_term_loan:             4000000,
        other_ltl:                  500000,
        paid_up_capital:            1500000,
        retained_earnings:          500000,
        reserve_fund:               300000,
        total_milk_collected:       1600000,
        milk_loss:                  80000,
        processing_loss:            0,
        avg_monthly_milk:           133000,
        lowest_monthly_milk:        80000,
        highest_monthly_milk:       180000,
        avg_inventory_value:        200000,
        credit_period_given_days:   21,
        top5_farmers_milk:          640000,
        highest_farmer_qty:         50000,
        lowest_farmer_qty:          500,
        total_farmers:              280,
        collection_days:            310,
        total_member_loans:         3500000,
        npa_member_loans:           280000,
        overdue_member_loans:       400000,
        restructured_loans_3yr:     'Few Times',
        max_dpd_members:            65,
        credit_history_flag:        'With few delays',
        cash_last_year:             1500000,
        cash_prev_year:             1800000,
        audit_observations:         5,
        mgmt_experience:            4,
        internal_control_score:     '20',
        loan_policy_compliance:     'No',
        vehicle_avail_pct:          'Yes',
        storage_cold_facility:      'No',
        quality_sop_score:          '65',
        insurance_available:        'No',
        digital_mis_pos:            'Partial',
        regulatory_compliance:      'Partial',
        climatic_risk_score:        '5',
        credit_history_bfi:         'Watch List',
        max_dpd_bfi:                10,
        meeting_frequency:          'Monthly',
        member_info_transparency:   'Sometimes',
        fund_usage:                 'Buying Milk',
        kyc_aml:                    'Sometimes',
        income_expense_checked:     'Occasionally',
        right_to_information:       'Sometimes beforehand',
        community_support_level:    'Moderate',
        emergency_response:         'Ad-hoc'
    },

    d_risk: {
        _label: 'D Risk — High Risk',
        _color: '#b91c1c',
        coop_name:                  'Failing Test Cooperative (Test)',
        years_operation:            1,
        office_location:            'Remote District',
        existing_loan:              3000000,
        proposed_loan:              6000000,
        interest_rate:              16,
        loan_tenure:                36,
        installment_freq:           'Annual',
        primary_land_value:         2000000,
        milk_sales:                 8000000,
        other_product_sales:        0,
        other_income:               100000,
        grant_income:               5000000,
        bank_sales:                 2000000,
        total_buyers:               50,
        top5_buyers_sales:          6500000,
        largest_buyer_sales:        4000000,
        gov_buyer_sales:            500000,
        no_govt_buyers:             1,
        large_private_buyer_sales:  3000000,
        no_private_sector_buyer:    2,
        small_buyer_sales:          2000000,
        no_small_buyer_sales:       20,
        avg_collection_days:        90,
        contract_coverage:          0,
        raw_milk_cost:              7000000,
        processing_cost:            0,
        packaging_cost:             0,
        other_processing_cost:      0,
        transport_cost:             300000,
        salary_expense:             900000,
        admin_expense:              300000,
        electricity_expense:        150000,
        fuel_expense:               120000,
        repair_expense:             80000,
        rent_expense:               60000,
        other_opex:                 200000,
        lowest_monthly_expense:     700000,
        annual_depreciation:        200000,
        amortization_amount:        0,
        cash_hand:                  50000,
        bank_balance:               350000,
        accounts_receivable:        2500000,
        inventory_value:            150000,
        prepaid_expenses:           0,
        other_current_assets:       50000,
        land_value:                 1800000,
        building_value:             600000,
        machinery_value:            400000,
        vehicle_value:              300000,
        furniture_value:            80000,
        other_fixed_assets:         50000,
        accounts_payable:           1500000,
        short_term_loan:            3000000,
        accrued_expenses:           600000,
        current_ltd:                1200000,
        long_term_loan:             4800000,
        other_ltl:                  1000000,
        paid_up_capital:            500000,
        retained_earnings:          -200000,
        reserve_fund:               100000,
        total_milk_collected:       700000,
        milk_loss:                  70000,
        processing_loss:            0,
        avg_monthly_milk:           58000,
        lowest_monthly_milk:        20000,
        highest_monthly_milk:       90000,
        avg_inventory_value:        100000,
        credit_period_given_days:   45,
        top5_farmers_milk:          420000,
        highest_farmer_qty:         30000,
        lowest_farmer_qty:          200,
        total_farmers:              90,
        collection_days:            260,
        total_member_loans:         2000000,
        npa_member_loans:           600000,
        overdue_member_loans:       800000,
        restructured_loans_3yr:     'Frequently',
        max_dpd_members:            120,
        credit_history_flag:        'Frequent delays',
        cash_last_year:             400000,
        cash_prev_year:             700000,
        audit_observations:         10,
        mgmt_experience:            1,
        internal_control_score:     '20',
        loan_policy_compliance:     'No',
        vehicle_avail_pct:          'No',
        storage_cold_facility:      'No',
        quality_sop_score:          '15',
        insurance_available:        'No',
        digital_mis_pos:            'No',
        regulatory_compliance:      'No',
        climatic_risk_score:        '8',
        credit_history_bfi:         'Substandard',
        max_dpd_bfi:                45,
        meeting_frequency:          'Rarely',
        member_info_transparency:   'Decided among few',
        fund_usage:                 'Other things',
        kyc_aml:                    'Hard',
        income_expense_checked:     'Never',
        right_to_information:       'Only after implementation',
        community_support_level:    'Minimal',
        emergency_response:         'No Plan'
    }
};

// ── Dev Panel UI ──────────────────────────────────────────────────────────────
function _initDevPanel() {
    if (document.getElementById('_devpanel')) return;

    const style = document.createElement('style');
    style.textContent = `
        #_devpanel{position:fixed;bottom:24px;right:24px;z-index:88888;font-family:'DM Sans',sans-serif}
        #_devpanel_btn{width:44px;height:44px;background:#1a1a1a;color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:18px;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
        #_devpanel_btn:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,.3)}
        #_devpanel_popup{display:none;position:absolute;bottom:54px;right:0;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:14px;min-width:230px}
        #_devpanel_popup.open{display:block;animation:devPop .18s ease}
        @keyframes devPop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        ._devpanel_title{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:10px}
        ._dp_btn{display:flex;align-items:center;gap:9px;width:100%;padding:9px 12px;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;color:#1a1a1a;margin-bottom:6px;transition:all .15s;text-align:left}
        ._dp_btn:last-child{margin-bottom:0}
        ._dp_btn:hover{background:#f3f4f6;border-color:#d1d5db}
        ._dp_dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
        ._dp_sub{font-size:10.5px;font-weight:400;color:#9ca3af;margin-left:auto}
        ._dp_divider{height:1px;background:#f3f4f6;margin:8px 0}
        ._dp_clear{width:100%;padding:7px 12px;border-radius:8px;border:1px solid #fca5a5;background:#fef2f2;cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;color:#b91c1c;transition:all .15s}
        ._dp_clear:hover{background:#fee2e2}
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = '_devpanel';
    panel.innerHTML = `
        <div id="_devpanel_popup">
            <div class="_devpanel_title">⚡ Quick Test Data</div>
            <button class="_dp_btn" onclick="fillTestData('a_risk')"><span class="_dp_dot" style="background:#16a34a"></span>A Risk — Excellent<span class="_dp_sub">~880 pts</span></button>
            <button class="_dp_btn" onclick="fillTestData('b_risk')"><span class="_dp_dot" style="background:#2563eb"></span>B Risk — Solid<span class="_dp_sub">~720 pts</span></button>
            <button class="_dp_btn" onclick="fillTestData('c_risk')"><span class="_dp_dot" style="background:#d97706"></span>C Risk — Average<span class="_dp_sub">~540 pts</span></button>
            <button class="_dp_btn" onclick="fillTestData('d_risk')"><span class="_dp_dot" style="background:#b91c1c"></span>D Risk — High Risk<span class="_dp_sub">~290 pts</span></button>
            <div class="_dp_divider"></div>
            <button class="_dp_clear" onclick="clearTestData()">✕ Clear All Fields</button>
        </div>
        <button id="_devpanel_btn" onclick="toggleDevPanel()" title="Quick Test Data">⚡</button>
    `;
    document.body.appendChild(panel);
}

function toggleDevPanel() {
    document.getElementById('_devpanel_popup')?.classList.toggle('open');
}

document.addEventListener('click', e => {
    const panel = document.getElementById('_devpanel');
    if (panel && !panel.contains(e.target))
        document.getElementById('_devpanel_popup')?.classList.remove('open');
});

function fillTestData(presetKey) {
    const data = TEST_PRESETS[presetKey];
    if (!data) return;
    Object.entries(data).forEach(([id, val]) => {
        if (id.startsWith('_')) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (typeof calculateTotalLoan    === 'function') calculateTotalLoan();
    if (typeof calculateRevenue      === 'function') calculateRevenue();
    if (typeof calculateBuyerShares  === 'function') calculateBuyerShares();
    if (typeof calculateExpenses     === 'function') calculateExpenses();
    if (typeof calculateAssets       === 'function') calculateAssets();
    if (typeof calculateLiabilities  === 'function') calculateLiabilities();
    if (typeof calculateNetWorth     === 'function') calculateNetWorth();
    if (typeof calculateMilkMetrics  === 'function') calculateMilkMetrics();
    document.getElementById('_devpanel_popup')?.classList.remove('open');
    if (typeof showToast === 'function') showToast(`Filled: ${data._label}`, 'success');
}

function clearTestData() {
    document.querySelectorAll('#questions_container input, #questions_container select').forEach(el => {
        if (el.type === 'select-one') el.selectedIndex = 0; else el.value = '';
    });
    document.getElementById('_devpanel_popup')?.classList.remove('open');
    if (typeof showToast === 'function') showToast('All fields cleared.', 'info');
}

const _devObserver = new MutationObserver(() => {
    const q = document.getElementById('questions');
    if (q && !q.classList.contains('hidden')) _initDevPanel();
});
_devObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

document.addEventListener('DOMContentLoaded', () => {
    const q = document.getElementById('questions');
    if (q && !q.classList.contains('hidden')) _initDevPanel();
    const origNav = window.navigateTo;
    if (typeof origNav === 'function') {
        window.navigateTo = function(sectionId, pushHash) {
            origNav(sectionId, pushHash);
            if (sectionId === 'questions') setTimeout(_initDevPanel, 200);
        };
    }
});