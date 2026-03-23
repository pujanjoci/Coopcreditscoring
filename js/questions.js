/**
 * questions.js — Complete Static Questionnaire Definition
 * Source: Official questionnaire sheet (120 questions, S.N 1–120)
 *
 * Field IDs are aligned to the Google Sheet "Bifurcation" column.
 *
 * Rules enforced by formHandler.js:
 *   - readonly: true  → hidden input only (auto-calculated, not shown to user)
 *   - disabled: true  → hidden input only (auto-filled by config)
 *   - isModelB: true  → only shown for Collection & Processing model
 *   - All visible fields are mandatory before submission
 */

const QUESTIONNAIRE = {
    sections: [

        // ── Section 1: Identity & Classification (S.N 1–5) ───────────────────
        {
            id: 'section_1',
            title: 'Identity & Classification',
            icon: 'info',
            subtitle: 'सहकारीको पहिचान र वर्गीकरण',
            questions: [
                {
                    // S.N 1  |  sheet: coop_name
                    id: 'coop_name', type: 'text',
                    labelEng: 'What is the name of the cooperative?',
                    labelNep: 'सहकारीको नाम के हो?',
                    placeholder: 'e.g., ABC Dairy Cooperative'
                },
                {
                    // S.N 2  |  sheet: model_type  — auto-filled from config, hidden
                    id: 'model_type', type: 'select',
                    labelEng: 'Which model does the cooperative operate under? (A / B)',
                    labelNep: 'सहकारी कुन मोडेलमा चलिरहेको छ? (A / B)',
                    disabled: true,
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Milk Collection Only (Model A)', label: 'Milk Collection Only / केवल दूध सङ्कलन' },
                        { value: 'Collection & Processing (Model B)', label: 'Processing / प्रशोधन' }
                    ]
                },
                {
                    // S.N 3  |  sheet: is_existing  — auto-filled from config, hidden
                    id: 'is_existing', type: 'select',
                    labelEng: 'Is the loan new or existing?',
                    labelNep: 'सहकारी ऋण नयाँ हो कि पहिलेबाट छ?',
                    disabled: true,
                    options: [
                        { value: 'New Loan', label: 'New / नयाँ' },
                        { value: 'Existing Loan', label: 'Existing / पहिलेबाट रहेको' }
                    ]
                },
                {
                    // S.N 4  |  sheet: years_operation
                    id: 'years_operation', type: 'number',
                    labelEng: 'How many years has the cooperative been operating?',
                    labelNep: 'सहकारी कति वर्षदेखि सञ्चालनमा छ?',
                    min: 0, placeholder: 'e.g., 10'
                },
                {
                    // S.N 5  |  sheet: office_location
                    id: 'office_location', type: 'text',
                    labelEng: 'Where is the cooperative office located?',
                    labelNep: 'सहकारीको कार्यालय कहाँ छ?',
                    placeholder: 'e.g., Kathmandu, Bagmati'
                }
            ]
        },

        // ── Section 2: Loan Information (S.N 6–11) ───────────────────────────
        {
            id: 'section_2',
            title: 'Loan Information',
            icon: 'landmark',
            subtitle: 'ऋण सम्बन्धी जानकारी',
            questions: [
                {
                    // S.N 6  |  sheet: existing_loan_amt
                    id: 'existing_loan_amt', type: 'number',
                    labelEng: 'What is the outstanding amount of the existing loan?',
                    labelNep: 'हाल चालु ऋणको बाँकी रकम कति छ?',
                    min: 0, placeholder: 'e.g., 1500000',
                    oninput: 'calculateTotalLoan()'
                },
                {
                    // S.N 7  |  sheet: proposed_loan_amt
                    id: 'proposed_loan_amt', type: 'number',
                    labelEng: 'What is the proposed new loan amount?',
                    labelNep: 'नयाँ प्रस्तावित ऋण रकम कति हो?',
                    min: 0, placeholder: 'e.g., 2000000',
                    oninput: 'calculateTotalLoan()'
                },
                {
                    // S.N 8  |  sheet: Total Loan  — auto-calculated
                    id: 'total_loan', type: 'number',
                    labelEng: 'Total Loan (existing + new) — Auto',
                    labelNep: 'जम्मा ऋण (पुरानो + नयाँ)',
                    readonly: true
                },
                {
                    // S.N 9  |  sheet: interest_rate
                    id: 'interest_rate', type: 'number',
                    labelEng: 'What is the interest rate (%)?',
                    labelNep: 'ऋणको ब्याजदर कति प्रतिशत छ?',
                    step: 0.01, min: 0, max: 100, placeholder: 'e.g., 10'
                },
                {
                    // S.N 10  |  sheet: loan_tenure_months
                    id: 'loan_tenure_months', type: 'number',
                    labelEng: 'What is the loan tenure (in months)?',
                    labelNep: 'ऋण तिर्ने अवधि कति महिना हो?',
                    min: 1, placeholder: 'e.g., 60'
                },
                {
                    // S.N 11  |  sheet: repayment_frequency
                    id: 'repayment_frequency', type: 'select',
                    labelEng: 'What is the installment frequency?',
                    labelNep: 'किस्ताको भुक्तानी आवृत्ति के हो?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Monthly', label: 'Monthly / मासिक' },
                        { value: 'Quarterly', label: 'Quarterly / त्रैमासिक' },
                        { value: 'Annual', label: 'Annually / वार्षिक' }
                    ]
                }
            ]
        },

        // ── Section 3: Revenue & Sales (S.N 12–18) ───────────────────────────
        {
            id: 'section_3',
            title: 'Revenue & Sales',
            icon: 'trending-up',
            subtitle: 'आम्दानी र बिक्री',
            questions: [
                {
                    // S.N 12  |  sheet: milk_sales
                    id: 'milk_sales', type: 'number',
                    labelEng: 'Income from milk sales?',
                    labelNep: 'दूध बिक्रीबाट कति आम्दानी हुन्छ?',
                    min: 0, placeholder: 'e.g., 28000000',
                    oninput: 'calculateRevenue()'
                },
                {
                    // S.N 13  |  sheet: product_sales
                    id: 'product_sales', type: 'number',
                    labelEng: 'Income from other product sales?',
                    labelNep: 'अन्य उत्पादन बिक्रीबाट कति आम्दानी हुन्छ?',
                    min: 0, placeholder: 'e.g., 1800000',
                    oninput: 'calculateRevenue()'
                },
                {
                    // S.N 14  |  sheet: other_sales
                    id: 'other_sales', type: 'number',
                    labelEng: 'Other income amount?',
                    labelNep: 'अन्य आम्दानी कति छ?',
                    min: 0, placeholder: 'e.g., 200000',
                    oninput: 'calculateRevenue()'
                },
                {
                    // S.N 15  |  sheet: Total Sales  — auto-calculated
                    id: 'total_sales', type: 'number',
                    labelEng: 'Total Sales — Auto',
                    labelNep: 'कुल बिक्री कति छ?',
                    readonly: true
                },
                {
                    // S.N 16  |  sheet: grant_income
                    id: 'grant_income', type: 'number',
                    labelEng: 'Income from grants / subsidies?',
                    labelNep: 'अनुदानबाट कति आम्दानी भएको छ?',
                    min: 0, placeholder: 'e.g., 500000',
                    oninput: 'calculateRevenue()'
                },
                {
                    // S.N 17  |  sheet: Total_Revenue  — auto-calculated
                    id: 'total_revenue', type: 'number',
                    labelEng: 'Total Revenue — Auto',
                    labelNep: 'कुल आम्दानी (Total Revenue)',
                    readonly: true
                },
                {
                    // S.N 18  |  sheet: bank_sales
                    id: 'bank_sales', type: 'number',
                    labelEng: 'Sales received through bank?',
                    labelNep: 'बैंक मार्फत भएको बिक्री कति छ?',
                    min: 0, placeholder: 'e.g., 15000000'
                }
            ]
        },

        // ── Section 4: Buyer Analysis (S.N 19–32) ────────────────────────────
        {
            id: 'section_4',
            title: 'Buyer Analysis',
            icon: 'users',
            subtitle: 'खरिदकर्ता विश्लेषण',
            questions: [
                {
                    // S.N 19  |  sheet: total_number_of_buyers
                    id: 'total_number_of_buyers', type: 'number',
                    labelEng: 'Total number of buyers?',
                    labelNep: 'जम्मा खरिदकर्ता संख्या कति छ?',
                    min: 1, placeholder: 'e.g., 300'
                },
                {
                    // S.N 20  |  sheet: top5_buyers_sales
                    id: 'top5_buyers_sales', type: 'number',
                    labelEng: 'Sales from top 5 buyers?',
                    labelNep: 'शीर्ष ५ खरिदकर्ताबाट कति बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 8000000',
                    oninput: 'calculateBuyerShares()'
                },
                {
                    // S.N 21  |  sheet: largest_buyer_sales
                    id: 'largest_buyer_sales', type: 'number',
                    labelEng: 'Sales from largest single buyer?',
                    labelNep: 'सबैभन्दा ठूलो एक जना खरिदकर्ताबाट कति बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 2000000',
                    oninput: 'calculateBuyerShares()'
                },
                {
                    // S.N 22  |  sheet: gov_buyer_sales
                    id: 'gov_buyer_sales', type: 'number',
                    labelEng: 'Sales to government entities?',
                    labelNep: 'सरकारी निकायलाई कति बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 5000000'
                },
                {
                    // S.N 23  |  sheet: no_govt_buyers
                    id: 'no_govt_buyers', type: 'number',
                    labelEng: 'Number of government entity buyers?',
                    labelNep: 'कति सरकारी निकायलाई बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 2'
                },
                {
                    // S.N 24  |  sheet: large_private_buyer_sales
                    id: 'large_private_buyer_sales', type: 'number',
                    labelEng: 'Sales to large private dairies?',
                    labelNep: 'ठूला निजी डेरीलाई कति बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 10000000'
                },
                {
                    // S.N 25  |  sheet: no_private_sector_buyer
                    id: 'no_private_sector_buyer', type: 'number',
                    labelEng: 'Number of large / private sector buyers?',
                    labelNep: 'कति निजी डेरीलाई बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 5'
                },
                {
                    // S.N 26  |  sheet: small_buyer_sales
                    id: 'small_buyer_sales', type: 'number',
                    labelEng: 'Sales to small / unreliable buyers?',
                    labelNep: 'साना वा अनिश्चित खरिदकर्तालाई कति बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 1000000'
                },
                {
                    // S.N 27  |  sheet: no_small_buyer_sales
                    id: 'no_small_buyer_sales', type: 'number',
                    labelEng: 'Number of small / unreliable buyers?',
                    labelNep: 'कति साना वा अनिश्चित खरिदकर्तालाई बिक्री हुन्छ?',
                    min: 0, placeholder: 'e.g., 10'
                },
                {
                    // S.N 28  |  sheet: avg_payment_days_buyers
                    id: 'avg_payment_days_buyers', type: 'number',
                    labelEng: 'Average collection period (days)?',
                    labelNep: 'खरिदकर्ताले भुक्तानी गर्न औसत कति दिन लिन्छन्?',
                    min: 0, placeholder: 'e.g., 35'
                },
                {
                    // S.N 30  |  sheet: top5_buyer_share_percent  — auto-calculated
                    id: 'top5_buyer_share_percent', type: 'number',
                    labelEng: '% share of top 5 buyers — Auto',
                    labelNep: 'शीर्ष ५ खरिदकर्ताको हिस्सा कति प्रतिशत छ?',
                    readonly: true
                },
                {
                    // S.N 31  |  sheet: largest_buyer_share_percent  — auto-calculated
                    id: 'largest_buyer_share_percent', type: 'number',
                    labelEng: '% share of largest buyer — Auto',
                    labelNep: 'सबैभन्दा ठूलो खरिदकर्ताको हिस्सा कति प्रतिशत छ?',
                    readonly: true
                },
                {
                    // S.N 32  |  sheet: contract_coverage
                    id: 'contract_coverage', type: 'number',
                    labelEng: 'Number of buyers under contract?',
                    labelNep: 'कति बिक्री करार (Contract) मा छ?',
                    min: 0, placeholder: 'e.g., 5'
                }
            ]
        },

        // ── Section 5: Operating Costs (S.N 29, 33–47) ───────────────────────
        {
            id: 'section_5',
            title: 'Operating Costs',
            icon: 'receipt',
            subtitle: 'सञ्चालन खर्च',
            questions: [
                {
                    // S.N 29  |  sheet: raw_milk_purchase_cost
                    id: 'raw_milk_purchase_cost', type: 'number',
                    labelEng: 'Cost of raw milk purchase?',
                    labelNep: 'कच्चा दूध किन्न कति खर्च हुन्छ?',
                    min: 0, placeholder: 'e.g., 20000000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 33  |  sheet: processing_cost  — Model B only
                    id: 'processing_cost', type: 'number',
                    labelEng: 'Processing cost?',
                    labelNep: 'प्रशोधन खर्च कति हुन्छ?',
                    isModelB: true, min: 0, placeholder: 'e.g., 1000000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 34  |  sheet: packaging_cost  — Model B only
                    id: 'packaging_cost', type: 'number',
                    labelEng: 'Packaging cost?',
                    labelNep: 'प्याकेजिङ खर्च कति हुन्छ?',
                    isModelB: true, min: 0, placeholder: 'e.g., 500000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 35  |  sheet: transport_cost
                    id: 'transport_cost', type: 'number',
                    labelEng: 'Transportation cost?',
                    labelNep: 'ढुवानी खर्च कति हुन्छ?',
                    min: 0, placeholder: 'e.g., 500000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 36  |  sheet: other_processing_cost  — Model B only
                    id: 'other_processing_cost', type: 'number',
                    labelEng: 'Other processing cost?',
                    labelNep: 'अन्य उत्पादन खर्च कति हुन्छ?',
                    isModelB: true, min: 0, placeholder: 'e.g., 200000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 37  |  sheet: salary_expense
                    id: 'salary_expense', type: 'number',
                    labelEng: 'Salary expense?',
                    labelNep: 'तलब खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 1500000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 38  |  sheet: admin_expense
                    id: 'admin_expense', type: 'number',
                    labelEng: 'Administrative expense?',
                    labelNep: 'प्रशासनिक खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 400000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 39  |  sheet: electricity_expense
                    id: 'electricity_expense', type: 'number',
                    labelEng: 'Electricity expense?',
                    labelNep: 'बिजुली खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 250000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 40  |  sheet: fuel_expense
                    id: 'fuel_expense', type: 'number',
                    labelEng: 'Fuel expense?',
                    labelNep: 'इन्धन खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 180000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 41  |  sheet: maintenance_expense
                    id: 'maintenance_expense', type: 'number',
                    labelEng: 'Repair & maintenance expense?',
                    labelNep: 'मर्मत खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 120000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 42  |  sheet: rent_expense
                    id: 'rent_expense', type: 'number',
                    labelEng: 'Rent expense?',
                    labelNep: 'भाडा खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 100000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 43  |  sheet: other_operating_expense
                    id: 'other_operating_expense', type: 'number',
                    labelEng: 'Other operating expenses?',
                    labelNep: 'अन्य सञ्चालन खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 200000',
                    oninput: 'calculateExpenses()'
                },
                {
                    // S.N 44  |  sheet: Operating Expenses  — auto-calculated
                    id: 'total_opex', type: 'number',
                    labelEng: 'Total operating expenses — Auto',
                    labelNep: 'कुल सञ्चालन खर्च कति छ?',
                    readonly: true
                },
                {
                    // S.N 46  |  sheet: depreciation
                    id: 'depreciation', type: 'number',
                    labelEng: 'Annual depreciation?',
                    labelNep: 'वार्षिक मूल्यह्रास कति छ?',
                    min: 0, placeholder: 'e.g., 500000'
                },
                {
                    // S.N 47  |  sheet: amortization
                    id: 'amortization', type: 'number',
                    labelEng: 'Amortization amount?',
                    labelNep: 'अमोर्टाइजेसन कति छ?',
                    min: 0, placeholder: 'e.g., 0'
                }
            ]
        },

        // ── Section 6: Assets (S.N 48–63) ────────────────────────────────────
        {
            id: 'section_6',
            title: 'Assets',
            icon: 'package',
            subtitle: 'सम्पत्ति विवरण',
            questions: [
                {
                    // S.N 48  |  sheet: cash_on_hand
                    id: 'cash_on_hand', type: 'number',
                    labelEng: 'Cash in hand?',
                    labelNep: 'हातमा नगद कति छ?',
                    min: 0, placeholder: 'e.g., 100000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 49  |  sheet: bank_balance
                    id: 'bank_balance', type: 'number',
                    labelEng: 'Bank balance?',
                    labelNep: 'बैंक खातामा कति रकम छ?',
                    min: 0, placeholder: 'e.g., 2000000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 50  |  sheet: Total Cash  — auto-calculated
                    id: 'total_cash', type: 'number',
                    labelEng: 'Total cash (hand + bank) — Auto',
                    labelNep: 'जम्मा नगद (हात + बैंक) कति छ?',
                    readonly: true
                },
                {
                    // S.N 51  |  sheet: accounts_receivable
                    id: 'accounts_receivable', type: 'number',
                    labelEng: 'Accounts receivable amount?',
                    labelNep: 'पाउनु पर्ने रकम (Accounts Receivable) कति छ?',
                    min: 0, placeholder: 'e.g., 500000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 52  |  sheet: inventory
                    id: 'inventory', type: 'number',
                    labelEng: 'Inventory value?',
                    labelNep: 'गोदाममा स्टक कति मूल्यको छ?',
                    min: 0, placeholder: 'e.g., 300000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 53  |  sheet: prepaid_expense
                    id: 'prepaid_expense', type: 'number',
                    labelEng: 'Prepaid expenses?',
                    labelNep: 'अग्रिम तिरेको खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 50000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 54  |  sheet: other_current_assets
                    id: 'other_current_assets', type: 'number',
                    labelEng: 'Other current assets?',
                    labelNep: 'अन्य चालु सम्पत्ति कति छ?',
                    min: 0, placeholder: 'e.g., 100000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 55  |  sheet: current_assets  — auto-calculated
                    id: 'current_assets', type: 'number',
                    labelEng: 'Total current assets — Auto',
                    labelNep: 'कुल चालु सम्पत्ति कति छ?',
                    readonly: true
                },
                {
                    // S.N 56  |  sheet: land_value
                    id: 'land_value', type: 'number',
                    labelEng: 'Land value?',
                    labelNep: 'जग्गाको मूल्य कति छ?',
                    min: 0, placeholder: 'e.g., 5000000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 57  |  sheet: building_value
                    id: 'building_value', type: 'number',
                    labelEng: 'Building value?',
                    labelNep: 'भवनको मूल्य कति छ?',
                    min: 0, placeholder: 'e.g., 2000000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 58  |  sheet: plant_machinery_value
                    id: 'plant_machinery_value', type: 'number',
                    labelEng: 'Machinery value?',
                    labelNep: 'मेसिनरीको मूल्य कति छ?',
                    min: 0, placeholder: 'e.g., 1500000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 59  |  sheet: vehicle_value
                    id: 'vehicle_value', type: 'number',
                    labelEng: 'Vehicle value?',
                    labelNep: 'सवारी साधनको मूल्य कति छ?',
                    min: 0, placeholder: 'e.g., 800000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 60  |  sheet: furniture_value
                    id: 'furniture_value', type: 'number',
                    labelEng: 'Furniture value?',
                    labelNep: 'फर्निचरको मूल्य कति छ?',
                    min: 0, placeholder: 'e.g., 200000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 61  |  sheet: other_fixed_assets
                    id: 'other_fixed_assets', type: 'number',
                    labelEng: 'Other fixed assets?',
                    labelNep: 'अन्य स्थिर सम्पत्ति कति छ?',
                    min: 0, placeholder: 'e.g., 100000',
                    oninput: 'calculateAssets()'
                },
                {
                    // S.N 62  |  sheet: Non-Current Assets  — auto-calculated
                    id: 'non_current_assets', type: 'number',
                    labelEng: 'Total fixed assets — Auto',
                    labelNep: 'कुल अचल सम्पत्ति कति छ?',
                    readonly: true
                },
                {
                    // S.N 63  |  sheet: total_assets  — auto-calculated
                    id: 'total_assets', type: 'number',
                    labelEng: 'Total assets — Auto',
                    labelNep: 'कुल सम्पत्ति कति छ?',
                    readonly: true
                }
            ]
        },

        // ── Section 7: Liabilities (S.N 64–72) ───────────────────────────────
        {
            id: 'section_7',
            title: 'Liabilities',
            icon: 'credit-card',
            subtitle: 'दायित्व विवरण',
            questions: [
                {
                    // S.N 64  |  sheet: accounts_payable
                    id: 'accounts_payable', type: 'number',
                    labelEng: 'Accounts payable?',
                    labelNep: 'तिर्नुपर्ने बिल (Accounts Payable) कति छ?',
                    min: 0, placeholder: 'e.g., 500000',
                    oninput: 'calculateLiabilities()'
                },
                {
                    // S.N 65  |  sheet: short_term_loan
                    id: 'short_term_loan', type: 'number',
                    labelEng: 'Short-term loan?',
                    labelNep: 'छोटो अवधिको ऋण कति छ?',
                    min: 0, placeholder: 'e.g., 1000000',
                    oninput: 'calculateLiabilities()'
                },
                {
                    // S.N 66  |  sheet: accrued_expense
                    id: 'accrued_expense', type: 'number',
                    labelEng: 'Accrued expenses?',
                    labelNep: 'तिर्न बाँकी खर्च कति छ?',
                    min: 0, placeholder: 'e.g., 200000',
                    oninput: 'calculateLiabilities()'
                },
                {
                    // S.N 67  |  sheet: current_portion_long_term_debt
                    id: 'current_portion_long_term_debt', type: 'number',
                    labelEng: 'Current portion of long-term debt?',
                    labelNep: 'दीर्घकालीन ऋणको चालु भाग कति छ?',
                    min: 0, placeholder: 'e.g., 600000',
                    oninput: 'calculateLiabilities()'
                },
                {
                    // S.N 68  |  sheet: current_liabilities  — auto-calculated
                    id: 'current_liabilities', type: 'number',
                    labelEng: 'Total current liabilities — Auto',
                    labelNep: 'कुल चालु दायित्व कति छ?',
                    readonly: true
                },
                {
                    // S.N 69  |  sheet: long_term_loan
                    id: 'long_term_loan', type: 'number',
                    labelEng: 'Long-term loan?',
                    labelNep: 'दीर्घकालीन ऋण कति छ?',
                    min: 0, placeholder: 'e.g., 3000000',
                    oninput: 'calculateLiabilities()'
                },
                {
                    // S.N 70  |  sheet: other_long_term_liabilities
                    id: 'other_long_term_liabilities', type: 'number',
                    labelEng: 'Other long-term liabilities?',
                    labelNep: 'अन्य दीर्घकालीन दायित्व कति छ?',
                    min: 0, placeholder: 'e.g., 0',
                    oninput: 'calculateLiabilities()'
                },
                {
                    // S.N 71  |  sheet: non_current_liabilities  — auto-calculated
                    id: 'non_current_liabilities', type: 'number',
                    labelEng: 'Total long-term liabilities — Auto',
                    labelNep: 'कुल दीर्घकालीन दायित्व कति छ?',
                    readonly: true
                },
                {
                    // S.N 72  |  sheet: total_liabilities  — auto-calculated
                    id: 'total_liabilities', type: 'number',
                    labelEng: 'Total liabilities — Auto',
                    labelNep: 'कुल दायित्व कति छ?',
                    readonly: true
                }
            ]
        },

        // ── Section 8: Net Worth (S.N 73–76) ─────────────────────────────────
        {
            id: 'section_8',
            title: 'Net Worth & Equity',
            icon: 'trending-up',
            subtitle: 'नेट वर्थ र इक्विटी',
            questions: [
                {
                    // S.N 73  |  sheet: paid_up_capital
                    id: 'paid_up_capital', type: 'number',
                    labelEng: 'Paid-up capital?',
                    labelNep: 'चुक्ता पूँजी (Paid Up Capital) कति छ?',
                    min: 0, placeholder: 'e.g., 2000000',
                    oninput: 'calculateNetWorth()'
                },
                {
                    // S.N 74  |  sheet: retained_earnings
                    id: 'retained_earnings', type: 'number',
                    labelEng: 'Retained earnings?',
                    labelNep: 'सञ्चित नाफा (Retained Earnings) कति छ?',
                    placeholder: 'e.g., 500000 (can be negative)',
                    oninput: 'calculateNetWorth()'
                },
                {
                    // S.N 75  |  sheet: reserves
                    id: 'reserves', type: 'number',
                    labelEng: 'Reserve fund?',
                    labelNep: 'जगेडा / Reserve कोष कति छ?',
                    min: 0, placeholder: 'e.g., 300000',
                    oninput: 'calculateNetWorth()'
                },
                {
                    // S.N 76  |  sheet: Total_networth  — auto-calculated
                    id: 'total_networth', type: 'number',
                    labelEng: 'Total Net Worth — Auto',
                    labelNep: 'कुल नेट वर्थ (Total Networth)',
                    readonly: true
                }
            ]
        },

        // ── Section 9: Milk Collection & Supply (S.N 77–91) ──────────────────
        {
            id: 'section_9',
            title: 'Milk Collection & Supply',
            icon: 'droplets',
            subtitle: 'दूध सङ्कलन र आपूर्ति',
            questions: [
                {
                    // S.N 77  |  sheet: total_milk_collected_liters
                    id: 'total_milk_collected_liters', type: 'number',
                    labelEng: 'Total milk collected (litres)?',
                    labelNep: 'जम्मा सङ्कलन गरिएको दूध (Total Gross Milk Collected) कति लिटर हो?',
                    min: 0, placeholder: 'e.g., 2000000',
                    oninput: 'calculateMilkMetrics()'
                },
                {
                    // S.N 78  |  sheet: milk_loss_liters_during_collection
                    id: 'milk_loss_liters_during_collection', type: 'number',
                    labelEng: 'Milk loss during collection (litres)?',
                    labelNep: 'दूध नोक्सानी (Milk Loss) कति लिटर भयो?',
                    min: 0, placeholder: 'e.g., 40000',
                    oninput: 'calculateMilkMetrics()'
                },
                {
                    // S.N 79  |  sheet: loss_during_process  — Model B only
                    id: 'loss_during_process', type: 'number',
                    labelEng: 'Processing loss (litres)?',
                    labelNep: 'प्रोसेस गर्दा हुने घाटा (Loss During Process) कति लिटर भयो?',
                    isModelB: true, min: 0, placeholder: 'e.g., 20000',
                    oninput: 'calculateMilkMetrics()'
                },
                {
                    // S.N 80  |  sheet: produced_milk_model_b_liters  — auto-calculated
                    id: 'produced_milk_model_b_liters', type: 'number',
                    labelEng: 'Total milk sold / dispatched — Auto',
                    labelNep: 'बिक्री भएको दूध (Total Milk Quantity) कति लिटर भयो?',
                    readonly: true
                },
                {
                    // S.N 81  |  sheet: avg_monthly_milk_liters
                    id: 'avg_monthly_milk_liters', type: 'number',
                    labelEng: 'Average monthly milk collection (litres)?',
                    labelNep: 'औसत मासिक दूध सङ्कलन (Average Monthly Milk) कति लिटर हो?',
                    min: 0, placeholder: 'e.g., 170000'
                },
                {
                    // S.N 82  |  sheet: lowest_monthly_milk_liters
                    id: 'lowest_monthly_milk_liters', type: 'number',
                    labelEng: 'Lowest monthly milk (litres)?',
                    labelNep: 'सबैभन्दा कम मासिक दूध (Lowest Monthly Milk) कति लिटर हो?',
                    min: 0, placeholder: 'e.g., 100000'
                },
                {
                    // S.N 83  |  sheet: highest_monthly_milk_liters
                    id: 'highest_monthly_milk_liters', type: 'number',
                    labelEng: 'Highest monthly milk (litres)?',
                    labelNep: 'सबैभन्दा बढी मासिक दूध (Highest Monthly Milk) कति लिटर हो?',
                    min: 0, placeholder: 'e.g., 250000'
                },
                {
                    // S.N 84  |  sheet: average_inventory
                    id: 'average_inventory', type: 'number',
                    labelEng: 'Average inventory value?',
                    labelNep: 'औसत स्टक (Inventory) कति मूल्यको छ?',
                    min: 0, placeholder: 'e.g., 500000'
                },
                {
                    // S.N 85  |  sheet: credit_period_given_days
                    id: 'credit_period_given_days', type: 'number',
                    labelEng: 'Credit period given to farmers (days)?',
                    labelNep: 'किसानलाई दिनु भएको क्रेडिट अवधि (Credit Period Given) कति दिनको हो?',
                    min: 0, placeholder: 'e.g., 15'
                },
                {
                    // S.N 86  |  sheet: top5_farmer_collection_liters
                    id: 'top5_farmer_collection_liters', type: 'number',
                    labelEng: 'Milk from top 5 farmers (litres)?',
                    labelNep: 'शीर्ष ५ किसानबाट कति दूध सङ्कलन भयो?',
                    min: 0, placeholder: 'e.g., 300000'
                },
                {
                    // S.N 87  |  sheet: highest_farmer_quantity_liters
                    id: 'highest_farmer_quantity_liters', type: 'number',
                    labelEng: 'Highest supplying farmer (litres)?',
                    labelNep: 'सबैभन्दा धेरै दूध दिने किसान कति लिटर दिएको?',
                    min: 0, placeholder: 'e.g., 80000'
                },
                {
                    // S.N 88  |  sheet: lowest_farmer_quantity_liters
                    id: 'lowest_farmer_quantity_liters', type: 'number',
                    labelEng: 'Lowest supplying farmer (litres)?',
                    labelNep: 'सबैभन्दा कम दूध दिने किसान कति लिटर दिएको?',
                    min: 0, placeholder: 'e.g., 500'
                },
                {
                    // S.N 89  |  sheet: total_number_of_farmers
                    id: 'total_number_of_farmers', type: 'number',
                    labelEng: 'Total number of farmers?',
                    labelNep: 'कुल किसान संख्या कति छ?',
                    min: 0, placeholder: 'e.g., 450',
                    oninput: 'calculateMilkMetrics()'
                },
                {
                    // S.N 90  |  sheet: avg_farmer_quantity_liters  — auto-calculated
                    id: 'avg_farmer_quantity_liters', type: 'number',
                    labelEng: 'Average milk per farmer (litres) — Auto',
                    labelNep: 'प्रति किसान औसत दूध कति लिटर छ?',
                    readonly: true
                },
                {
                    // S.N 91  |  sheet: collection_days_positive
                    id: 'collection_days_positive', type: 'number',
                    labelEng: 'Total milk collection days in a year?',
                    labelNep: 'कति दिन दूध सङ्कलन भएको छ?',
                    min: 0, max: 365, placeholder: 'e.g., 340'
                }
            ]
        },

        // ── Section 10: Loan Recovery & NPA (S.N 92–97) ──────────────────────
        {
            id: 'section_10',
            title: 'Loan Recovery & NPA',
            icon: 'alert-circle',
            subtitle: 'ऋण असुली र खराब ऋण',
            questions: [
                {
                    // S.N 92  |  sheet: total_member_loans
                    id: 'total_member_loans', type: 'number',
                    labelEng: 'Total member loans?',
                    labelNep: 'सदस्यलाई दिइएको कुल ऋण (Total Member Loans) कति छ?',
                    min: 0, placeholder: 'e.g., 5000000'
                },
                {
                    // S.N 93  |  sheet: npa_member_loans
                    id: 'npa_member_loans', type: 'number',
                    labelEng: 'NPA member loans?',
                    labelNep: 'खराब ऋण (NPA Member Loans) कति छ?',
                    min: 0, placeholder: 'e.g., 200000',
                    hint: 'Non-Performing Assets — loans overdue by 90+ days'
                },
                {
                    // S.N 94  |  sheet: overdue_member_loans
                    id: 'overdue_member_loans', type: 'number',
                    labelEng: 'Overdue member loans?',
                    labelNep: 'म्याद नाघेको सदस्य ऋण (Overdue Member Loans) कति छ?',
                    min: 0, placeholder: 'e.g., 300000'
                },
                {
                    // S.N 95  |  sheet: restructured_loans_past3yrs
                    id: 'restructured_loans_past3yrs', type: 'select',
                    labelEng: 'Restructured loans in past 3 years?',
                    labelNep: 'पछिल्लो ३ वर्षमा पुनर्संरचना (Restructured Loans Past 3 yrs) कति भयो?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'None', label: 'Never / कहिल्यै होइन' },
                        { value: 'Few Times', label: 'Few Times / केही पटक' },
                        { value: 'Frequently', label: 'Frequent / बारम्बार' }
                    ]
                },
                {
                    // S.N 96  |  sheet: max_dpd_days
                    id: 'max_dpd_days', type: 'number',
                    labelEng: 'Maximum DPD days by members?',
                    labelNep: 'सबैभन्दा बढी ढिला भएको दिन (Max DPD) कति हो?',
                    min: 0, placeholder: 'e.g., 45'
                },
                {
                    // S.N 97  |  sheet: credit_history_flag
                    id: 'credit_history_flag', type: 'select',
                    labelEng: 'Credit history of members?',
                    labelNep: 'सहकारीको क्रेडिट इतिहास कस्तो छ? (Credit History Members)',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Timely', label: 'Timely / समयमा' },
                        { value: 'With few delays', label: 'With few delays' },
                        { value: 'Frequent delays', label: 'Frequent delays / बारम्बार ढिलाइ' }
                    ]
                }
            ]
        },

        // ── Section 11: Financial Performance (S.N 98–99, 102) ───────────────
        {
            id: 'section_11',
            title: 'Financial Performance',
            icon: 'bar-chart-2',
            subtitle: 'वित्तीय प्रदर्शन र लेखापरीक्षण',
            questions: [
                {
                    // S.N 98  |  sheet: cash_bank_balance_last_year
                    id: 'cash_bank_balance_last_year', type: 'number',
                    labelEng: 'Last year cash / bank balance?',
                    labelNep: 'गत वर्ष बैंक/नगद मौज्दात कति थियो?',
                    min: 0, placeholder: 'e.g., 3000000'
                },
                {
                    // S.N 99  |  sheet: cash_bank_balance_previous_year
                    id: 'cash_bank_balance_previous_year', type: 'number',
                    labelEng: 'Previous year cash / bank balance?',
                    labelNep: 'अघिल्लो वर्ष बैंक/नगद मौज्दात कति थियो?',
                    min: 0, placeholder: 'e.g., 2500000'
                },
                {
                    // S.N 102  |  sheet: audit_findings_count — dropdown
                    // DropdownOptions: 'Qualified', 'Few', 'None'
                    // Model: None→25pts, Few→15pts, Qualified→0pts
                    id: 'audit_findings_count', type: 'select',
                    labelEng: 'Number of audit observations / issues?',
                    labelNep: 'अडिटमा भेटिएका कमजोरीको संख्या कति छ?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'None', label: 'None — no issues / कुनै पनि छैन' },
                        { value: 'Few', label: 'Few — minor observations / थोरै' },
                        { value: 'Qualified', label: 'Qualified — major issues / योग्य' }
                    ]
                }
            ]
        },

        // ── Section 12: Governance & Management (S.N 100–104) ────────────────
        {
            id: 'section_12',
            title: 'Governance & Management',
            icon: 'shield',
            subtitle: 'व्यवस्थापन र शासन',
            questions: [
                {
                    // S.N 100  |  sheet: key_mgmt_avg_experience_years
                    id: 'key_mgmt_avg_experience_years', type: 'number',
                    labelEng: 'Average management experience (years)?',
                    labelNep: 'व्यवस्थापन टोली औसत अनुभव कति वर्ष छ?',
                    min: 0, placeholder: 'e.g., 8'
                },
                {
                    // S.N 101  |  sheet: internal_control_score
                    id: 'internal_control_score', type: 'select',
                    labelEng: 'Internal control score?',
                    labelNep: 'आन्तरिक नियन्त्रण स्कोर कति छ?',
                    hint: 'Assess the overall strength of internal financial controls',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Robust', label: 'Robust / बलियो' },
                        { value: 'Adequate', label: 'Adequate / पर्याप्त' },
                        { value: 'Weak', label: 'Weak / कमजोर' }
                    ]
                },
                {
                    // S.N 103  |  sheet: lending_policy_compliance_flag
                    id: 'lending_policy_compliance_flag', type: 'select',
                    labelEng: 'Loan policy compliance?',
                    labelNep: 'ऋण नीति पालन भएको छ कि छैन?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Yes', label: 'Yes / हो' },
                        { value: 'No', label: 'No / होइन' }
                    ]
                },
                {
                    // S.N 104  |  sheet: fleet_availability_percent
                    id: 'fleet_availability_percent', type: 'select',
                    labelEng: 'Vehicle availability (%)?',
                    labelNep: 'गाडी उपलब्धता प्रतिशत कति छ?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Yes', label: 'Yes / हो' },
                        { value: 'No', label: 'No / होइन' }
                    ]
                }
            ]
        },

        // ── Section 13: Logistics & Infrastructure (S.N 105–110) ─────────────
        {
            id: 'section_13',
            title: 'Logistics & Infrastructure',
            icon: 'truck',
            subtitle: 'भण्डारण, प्रविधि र जोखिम',
            questions: [
                {
                    // S.N 105  |  sheet: storage_availability_flag
                    id: 'storage_availability_flag', type: 'select',
                    labelEng: 'Storage / cold facility available?',
                    labelNep: 'गोदाम/चिस्यान सुविधा छ कि छैन?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Yes', label: 'Yes / हो' },
                        { value: 'No', label: 'No / होइन' }
                    ]
                },
                {
                    // S.N 106  |  sheet: quality_sop_score_model_b
                    id: 'quality_sop_score_model_b', type: 'select',
                    labelEng: 'Are there standards for milk collection, handling and storage? Are written documents available?',
                    labelNep: 'के दूध सङ्कलन, व्यवस्थापन, र भण्डारणका लागि मापदण्डहरू छन्? के तिनीहरूको लिखित दस्तावेज उपलब्ध छ?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Standards and documents exist. मापदण्ड र दस्तावेज छन्', label: 'Standards and documents exist / मापदण्ड र दस्तावेज छन्' },
                        { value: 'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन', label: 'Standards exist, no documents / मापदण्ड छन्, दस्तावेज छैन' },
                        { value: 'No standards (मापदण्ड छैन)', label: 'No standards / मापदण्ड छैन' }
                    ]
                },
                {
                    // S.N 107  |  sheet: insurance_coverage_flag
                    id: 'insurance_coverage_flag', type: 'select',
                    labelEng: 'Insurance available?',
                    labelNep: 'बीमा भएको छ कि छैन?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Yes', label: 'Yes / हो' },
                        { value: 'No', label: 'No / होइन' }
                    ]
                },
                {
                    // S.N 108  |  sheet: digital_mis_flag
                    id: 'digital_mis_flag', type: 'select',
                    labelEng: 'Digital MIS / POS / QR used?',
                    labelNep: 'डिजिटल MIS / POS / QR प्रयोग भएको छ कि छैन?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Yes', label: 'Yes / हो' },
                        { value: 'Partial', label: 'Partial / आंशिक' },
                        { value: 'No', label: 'No / होइन' }
                    ]
                },
                {
                    // S.N 109  |  sheet: regulatory_compliance_flag
                    id: 'regulatory_compliance_flag', type: 'select',
                    labelEng: 'Regulatory compliance?',
                    labelNep: 'नियामक पालना भएको छ कि छैन?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Full', label: 'Full / पूर्ण' },
                        { value: 'Partial', label: 'Partial / आंशिक' },
                        { value: 'None', label: 'None / कुनै पनि छैन' }
                    ]
                },
                {
                    // S.N 110  |  sheet: climatic_risk_score
                    id: 'climatic_risk_score', type: 'select',
                    labelEng: 'Climatic risk score?',
                    labelNep: 'मौसम जोखिम (Climatic Risk Score) कति छ?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Low', label: 'Low / कम' },
                        { value: 'Medium', label: 'Medium / मध्यम' },
                        { value: 'High', label: 'High / उच्च' }
                    ]
                }
            ]
        },

        // ── Section 14: Credit History — BFI (S.N 111–112) ───────────────────
        {
            id: 'section_14',
            title: 'Credit History — BFI',
            icon: 'globe',
            subtitle: 'बैंक तथा वित्त संस्थासँगको कर्जा इतिहास',
            questions: [
                {
                    // S.N 111  |  sheet: credit_history_banks
                    id: 'credit_history_banks', type: 'select',
                    labelEng: 'Credit History BFIs — cooperative credit history?',
                    labelNep: 'Credit History BFIs (सहकारीको क्रेडिट इतिहास कस्तो छ?)',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Pass', label: 'Pass / उत्तीर्ण' },
                        { value: 'Watch List', label: 'Watch List / निगरानी सूची' },
                        { value: 'Substandard', label: 'Substandard / मापदण्डभन्दा कमजोर' },
                        { value: 'Doubtful', label: 'Doubtful / शंकास्पद' },
                        { value: 'Loss', label: 'Loss / घाटा' }
                    ]
                },
                {
                    // S.N 112  |  sheet: dpd_days_banks
                    id: 'dpd_days_banks', type: 'number',
                    labelEng: 'Maximum DPD days in bank loan?',
                    labelNep: 'सहकारीको सबैभन्दा बढी ढिला भएको दिन कति हो?',
                    min: 0, placeholder: 'e.g., 0',
                    hint: 'Enter 0 if no overdue payments on bank loans'
                }
            ]
        },

        // ── Section 15: Behavioral & Community (S.N 113–120) ─────────────────
        {
            id: 'section_15',
            title: 'Behavioral & Community',
            icon: 'heart',
            subtitle: 'व्यवहार र सामुदायिक सहभागिता',
            questions: [
                {
                    // S.N 113  |  sheet: Committee Meeting Frequency
                    id: 'meeting_frequency', type: 'select',
                    labelEng: 'How often does the committee usually hold meetings?',
                    labelNep: 'समितिको बैठक प्रायः कति नियमिततामा हुने गर्छ?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Weekly', label: 'Weekly / साप्ताहिक' },
                        { value: 'Monthly', label: 'Monthly / मासिक' },
                        { value: 'Quarterly', label: 'Quarterly / त्रैमासिक' },
                        { value: 'Annually', label: 'Annually / वार्षिक' }
                    ]
                },
                {
                    // S.N 114  |  sheet: Member Info Transparency
                    id: 'member_info_transparency', type: 'select',
                    labelEng: 'When a new plan or spending comes up, are members informed or decided among a few?',
                    labelNep: 'जब नयाँ योजना वा पैसा खर्च हुने कुरा आउँछ, सबै सदस्यलाई कुरा बुझाइन्छ कि भित्रै मात्र निर्णय हुन्छ?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Decided among few', label: 'Decided among few / सीमित व्यक्तिहरूले निर्णय गर्ने' },
                        { value: 'Sometimes', label: 'Sometimes / कहिलेकाहीँ' },
                        { value: 'Mostly', label: 'Mostly / प्रायः' },
                        { value: 'Always', label: 'Always / सधैं' }
                    ]
                },
                {
                    // S.N 115  |  sheet: Fund Usage
                    id: 'fund_usage', type: 'select',
                    labelEng: 'Last year, where did the cooperative spend most of its money?',
                    labelNep: 'पछिल्लो वर्ष सहकारीले सबैभन्दा बढी पैसा कुन काममा खर्च गर्यो?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Buying Milk', label: 'Buying Milk / दूध खरिद' },
                        { value: 'Processing', label: 'Processing / प्रशोधन' },
                        { value: 'Members', label: 'Members / सदस्यहरू' },
                        { value: 'Other things', label: 'Other things / अन्य कार्यहरू' }
                    ]
                },
                {
                    // S.N 116  |  sheet: KYC/AML
                    id: 'kyc_aml', type: 'select',
                    labelEng: 'Are all member records (name, address, amount) kept securely?',
                    labelNep: 'सदस्यहरूको सबै विवरण (नाम, ठेगाना, रकम) सही तरिकाले सुरक्षित राखिएको छ कि छैन?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Hard', label: 'Hard / गाह्रो' },
                        { value: 'Sometimes', label: 'Sometimes / कहिलेकाहीँ' },
                        { value: 'Mostly', label: 'Mostly / प्रायः' },
                        { value: 'Easily Found', label: 'Easily Found / सजिलै उपलब्ध' }
                    ]
                },
                {
                    // S.N 117  |  sheet: Income/Expense Checked
                    id: 'income_expense_checked', type: 'select',
                    labelEng: 'Did anyone check the cooperative\'s income and expenses last year?',
                    labelNep: 'पछिल्लो वर्ष सहकारीको आम्दानी र खर्च कसैले जाँच गर्यो?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Never', label: 'Never / कहिल्यै होइन' },
                        { value: 'Once', label: 'Once / एक पटक' },
                        { value: 'Occasionally', label: 'Occasionally / बेलाबेला' },
                        { value: 'Regularly', label: 'Regularly / नियमित रूपमा' }
                    ]
                },
                {
                    // S.N 118  |  sheet: Right to Information
                    id: 'right_to_information', type: 'select',
                    labelEng: 'When any new plan or rule is implemented, are members informed beforehand?',
                    labelNep: 'कुनै पनि नयाँ योजना वा नियम लागू हुँदा, यसको बारेमा सदस्यलाई पहिले सूचित गरिन्छ कि गरिंदैन?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Only after implementation', label: 'Only after implementation / कार्यान्वयन पछि मात्र' },
                        { value: 'Sometimes beforehand', label: 'Sometimes beforehand / कहिलेकाहीँ पहिले' },
                        { value: 'Mostly Beforehand', label: 'Mostly Beforehand / प्रायः पहिले' },
                        { value: 'Always Beforehand', label: 'Always Beforehand / सधैं पहिले' }
                    ]
                },
                {
                    // S.N 119  |  sheet: Community Support
                    id: 'community_support_level', type: 'select',
                    labelEng: 'What did the cooperative help with in the village last year?',
                    labelNep: 'पछिल्लो साल सहकारीले गाउँमा के सहयोग गरेको थियो?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Never', label: 'Never / कहिल्यै होइन' },
                        { value: 'Sometimes', label: 'Sometimes / कहिलेकाहीँ' },
                        { value: 'Frequently', label: 'Frequently / बारम्बार' }
                    ]
                },
                {
                    // S.N 120  |  sheet: Emergency Preparedness
                    id: 'emergency_response', type: 'select',
                    labelEng: 'When milk is low or emergencies happen, what does the cooperative usually do?',
                    labelNep: 'जब दूध कम हुन्छ वा आपत आउँछ, सहकारी प्रायः के गर्छ?',
                    options: [
                        { value: '', label: 'Select' },
                        { value: 'Nothing', label: 'Nothing / केही पनि होइन' },
                        { value: 'Little Preparation', label: 'Little Preparation / थोरै तयारी' },
                        { value: 'Normal', label: 'Normal / सामान्य' },
                        { value: 'Proper Plan', label: 'Proper Plan / उचित योजना' }
                    ]
                }
            ]
        }

    ]
};