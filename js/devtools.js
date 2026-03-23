/**
 * js/devtools.js — Quick Test Data Panel
 *
 * 16 presets covering:
 *   2 model types  (Collection Only | Collection & Processing)
 * × 2 customer types (New | Existing)
 * × 4 risk tiers    (A ~880 | B ~720 | C ~540 | D ~290)
 * = 16 combinations
 *
 * REMOVE this file before deploying to production.
 */

const TEST_PRESETS = {

    // ══════════════════════════════════════════════════════════════════════════
    // GROUP 1 — Collection Only × New Customer
    // ══════════════════════════════════════════════════════════════════════════

    col_new_a: {
        _label:'Collection Only — New Customer',_sublabel:'A Risk ~880 pts',_color:'#16a34a',_modelType:'collection',_customerType:'new',
        coop_name:'Himalayan Dairy Coop — ColNew A (Test)',years_operation:18,office_location:'Lalitpur, Bagmati',
        existing_loan_amt:0,proposed_loan_amt:3000000,interest_rate:9,loan_tenure_months:60,repayment_frequency:'Monthly',
        milk_sales:42000000,product_sales:3000000,other_sales:500000,grant_income:200000,bank_sales:38000000,
        total_number_of_buyers:20,top5_buyers_sales:10000000,largest_buyer_sales:2500000,
        gov_buyer_sales:8000000,no_govt_buyers:8,large_private_buyer_sales:20000000,no_private_sector_buyer:6,
        small_buyer_sales:500000,no_small_buyer_sales:6,avg_payment_days_buyers:10,contract_coverage:18,
        raw_milk_purchase_cost:28000000,transport_cost:600000,
        salary_expense:2000000,admin_expense:500000,electricity_expense:300000,fuel_expense:200000,maintenance_expense:150000,rent_expense:100000,other_operating_expense:200000,
        depreciation:800000,amortization:100000,
        cash_on_hand:500000,bank_balance:5000000,accounts_receivable:800000,inventory:600000,prepaid_expense:100000,other_current_assets:200000,
        land_value:8000000,building_value:3000000,plant_machinery_value:2500000,vehicle_value:1500000,furniture_value:300000,other_fixed_assets:200000,
        accounts_payable:300000,short_term_loan:0,accrued_expense:100000,current_portion_long_term_debt:600000,long_term_loan:2400000,other_long_term_liabilities:0,
        paid_up_capital:5000000,retained_earnings:4000000,reserves:2000000,
        total_milk_collected_liters:4200000,milk_loss_liters_during_collection:42000,loss_during_process:0,
        avg_monthly_milk_liters:350000,lowest_monthly_milk_liters:315000,highest_monthly_milk_liters:420000,
        average_inventory:400000,credit_period_given_days:7,top5_farmer_collection_liters:500000,highest_farmer_quantity_liters:72000,lowest_farmer_quantity_liters:240,credit_history_flag:'Timely',total_number_of_farmers:700,collection_days_positive:355,
        total_member_loans:8000000,npa_member_loans:80000,overdue_member_loans:120000,restructured_loans_past3yrs:'None',max_dpd_days:3,
        cash_bank_balance_last_year:5500000,cash_bank_balance_previous_year:4200000,
        audit_findings_count:'None',key_mgmt_avg_experience_years:12,internal_control_score:'Robust',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards and documents exist. मापदण्ड र दस्तावेज छन्',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Full',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Weekly',member_info_transparency:'Always',fund_usage:'Buying Milk',kyc_aml:'Easily Found',income_expense_checked:'Regularly',right_to_information:'Always Beforehand',community_support_level:'Frequently',emergency_response:'Proper Plan'
    },

    col_new_b: {
        _label:'Collection Only — New Customer',_sublabel:'B Risk ~720 pts',_color:'#2563eb',_modelType:'collection',_customerType:'new',
        coop_name:'Valley Dairy Coop — ColNew B (Test)',years_operation:10,office_location:'Hetauda, Bagmati',
        existing_loan_amt:0,proposed_loan_amt:4000000,interest_rate:11,loan_tenure_months:48,repayment_frequency:'Monthly',
        milk_sales:22000000,product_sales:1500000,other_sales:300000,grant_income:500000,bank_sales:16000000,
        total_number_of_buyers:30,top5_buyers_sales:8000000,largest_buyer_sales:3500000,
        gov_buyer_sales:4000000,no_govt_buyers:8,large_private_buyer_sales:10000000,no_private_sector_buyer:7,
        small_buyer_sales:800000,no_small_buyer_sales:15,avg_payment_days_buyers:30,contract_coverage:20,
        raw_milk_purchase_cost:15000000,transport_cost:400000,
        salary_expense:1200000,admin_expense:300000,electricity_expense:200000,fuel_expense:150000,maintenance_expense:100000,rent_expense:80000,other_operating_expense:120000,
        depreciation:500000,amortization:80000,
        cash_on_hand:200000,bank_balance:2500000,accounts_receivable:1200000,inventory:800000,prepaid_expense:50000,other_current_assets:100000,
        land_value:4000000,building_value:1500000,plant_machinery_value:1200000,vehicle_value:800000,furniture_value:150000,other_fixed_assets:100000,
        accounts_payable:500000,short_term_loan:0,accrued_expense:200000,current_portion_long_term_debt:800000,long_term_loan:3200000,other_long_term_liabilities:0,
        paid_up_capital:2500000,retained_earnings:1500000,reserves:800000,
        total_milk_collected_liters:2200000,milk_loss_liters_during_collection:44000,loss_during_process:0,
        avg_monthly_milk_liters:183000,lowest_monthly_milk_liters:146000,highest_monthly_milk_liters:220000,
        average_inventory:600000,credit_period_given_days:15,top5_farmer_collection_liters:400000,highest_farmer_quantity_liters:55000,lowest_farmer_quantity_liters:160,credit_history_flag:'With few delays',total_number_of_farmers:400,collection_days_positive:330,
        total_member_loans:5000000,npa_member_loans:300000,overdue_member_loans:400000,restructured_loans_past3yrs:'None',max_dpd_days:8,
        cash_bank_balance_last_year:2700000,cash_bank_balance_previous_year:2200000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:8,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Monthly',member_info_transparency:'Mostly',fund_usage:'Buying Milk',kyc_aml:'Mostly',income_expense_checked:'Regularly',right_to_information:'Mostly Beforehand',community_support_level:'Sometimes',emergency_response:'Normal'
    },

    col_new_c: {
        _label:'Collection Only — New Customer',_sublabel:'C Risk ~590 pts',_color:'#d97706',_modelType:'collection',_customerType:'new',
        coop_name:'Hills Dairy Coop — ColNew C (Test)',years_operation:5,office_location:'Pokhara, Gandaki',
        existing_loan_amt:0,proposed_loan_amt:5000000,interest_rate:13,loan_tenure_months:36,repayment_frequency:'Monthly',
        milk_sales:12000000,product_sales:800000,other_sales:200000,grant_income:500000,bank_sales:8500000,
        total_number_of_buyers:25,top5_buyers_sales:6000000,largest_buyer_sales:2800000,
        gov_buyer_sales:3000000,no_govt_buyers:5,large_private_buyer_sales:6000000,no_private_sector_buyer:5,
        small_buyer_sales:1000000,no_small_buyer_sales:15,avg_payment_days_buyers:55,contract_coverage:13,
        raw_milk_purchase_cost:9000000,transport_cost:300000,
        salary_expense:800000,admin_expense:200000,electricity_expense:120000,fuel_expense:100000,maintenance_expense:80000,rent_expense:60000,other_operating_expense:100000,
        depreciation:300000,amortization:50000,
        cash_on_hand:150000,bank_balance:1200000,accounts_receivable:1400000,inventory:500000,prepaid_expense:30000,other_current_assets:80000,
        land_value:2500000,building_value:900000,plant_machinery_value:700000,vehicle_value:450000,furniture_value:110000,other_fixed_assets:90000,
        accounts_payable:600000,short_term_loan:500000,accrued_expense:250000,current_portion_long_term_debt:900000,long_term_loan:3600000,other_long_term_liabilities:300000,
        paid_up_capital:1200000,retained_earnings:700000,reserves:250000,
        total_milk_collected_liters:1100000,milk_loss_liters_during_collection:55000,loss_during_process:0,
        avg_monthly_milk_liters:91667,lowest_monthly_milk_liters:72000,highest_monthly_milk_liters:120000,
        average_inventory:400000,credit_period_given_days:30,top5_farmer_collection_liters:280000,highest_farmer_quantity_liters:44000,lowest_farmer_quantity_liters:140,credit_history_flag:'With few delays',total_number_of_farmers:200,collection_days_positive:310,
        total_member_loans:3000000,npa_member_loans:300000,overdue_member_loans:450000,restructured_loans_past3yrs:'Few Times',max_dpd_days:12,
        cash_bank_balance_last_year:1350000,cash_bank_balance_previous_year:1100000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:6,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'Yes',storage_availability_flag:'No',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'No',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'High',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Monthly',member_info_transparency:'Sometimes',fund_usage:'Buying Milk',kyc_aml:'Sometimes',income_expense_checked:'Occasionally',right_to_information:'Sometimes beforehand',community_support_level:'Sometimes',emergency_response:'Little Preparation'
    },

    col_new_d: {
        _label:'Collection Only — New Customer',_sublabel:'D Risk ~290 pts',_color:'#b91c1c',_modelType:'collection',_customerType:'new',
        coop_name:'Remote Dairy Coop — ColNew D (Test)',years_operation:2,office_location:'Jumla, Karnali',
        existing_loan_amt:0,proposed_loan_amt:6000000,interest_rate:16,loan_tenure_months:24,repayment_frequency:'Annual',
        milk_sales:6000000,product_sales:0,other_sales:100000,grant_income:4000000,bank_sales:1500000,
        total_number_of_buyers:15,top5_buyers_sales:4000000,largest_buyer_sales:2500000,
        gov_buyer_sales:500000,no_govt_buyers:2,large_private_buyer_sales:2000000,no_private_sector_buyer:2,
        small_buyer_sales:1500000,no_small_buyer_sales:11,avg_payment_days_buyers:90,contract_coverage:3,
        raw_milk_purchase_cost:5000000,transport_cost:200000,
        salary_expense:600000,admin_expense:150000,electricity_expense:80000,fuel_expense:80000,maintenance_expense:60000,rent_expense:50000,other_operating_expense:80000,
        depreciation:200000,amortization:0,
        cash_on_hand:50000,bank_balance:200000,accounts_receivable:2000000,inventory:150000,prepaid_expense:0,other_current_assets:50000,
        land_value:1000000,building_value:400000,plant_machinery_value:300000,vehicle_value:200000,furniture_value:60000,other_fixed_assets:40000,
        accounts_payable:1200000,short_term_loan:2000000,accrued_expense:400000,current_portion_long_term_debt:1200000,long_term_loan:4800000,other_long_term_liabilities:800000,
        paid_up_capital:300000,retained_earnings:-300000,reserves:50000,
        total_milk_collected_liters:550000,milk_loss_liters_during_collection:44000,loss_during_process:0,
        avg_monthly_milk_liters:45000,lowest_monthly_milk_liters:18000,highest_monthly_milk_liters:70000,
        average_inventory:120000,credit_period_given_days:60,top5_farmer_collection_liters:350000,highest_farmer_quantity_liters:41200,lowest_farmer_quantity_liters:140,credit_history_flag:'Frequent delays',total_number_of_farmers:80,collection_days_positive:255,
        total_member_loans:1500000,npa_member_loans:450000,overdue_member_loans:600000,restructured_loans_past3yrs:'Frequently',max_dpd_days:90,
        cash_bank_balance_last_year:250000,cash_bank_balance_previous_year:400000,
        audit_findings_count:'Qualified',key_mgmt_avg_experience_years:2,internal_control_score:'Weak',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'No',storage_availability_flag:'No',
        quality_sop_score_model_b:'No standards (मापदण्ड छैन)',
        insurance_coverage_flag:'No',digital_mis_flag:'No',regulatory_compliance_flag:'None',climatic_risk_score:'Medium',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Annually',member_info_transparency:'Decided among few',fund_usage:'Other things',kyc_aml:'Hard',income_expense_checked:'Never',right_to_information:'Only after implementation',community_support_level:'Never',emergency_response:'Nothing'
    },

    // ══════════════════════════════════════════════════════════════════════════
    // GROUP 2 — Collection Only × Existing Customer
    // ══════════════════════════════════════════════════════════════════════════

    col_existing_a: {
        _label:'Collection Only — Existing Customer',_sublabel:'A Risk ~870 pts',_color:'#16a34a',_modelType:'collection',_customerType:'existing',
        coop_name:'Everest Dairy Coop — ColEx A (Test)',years_operation:20,office_location:'Bhaktapur, Bagmati',
        existing_loan_amt:2000000,proposed_loan_amt:3000000,interest_rate:9,loan_tenure_months:60,repayment_frequency:'Monthly',
        milk_sales:40000000,product_sales:2500000,other_sales:500000,grant_income:150000,bank_sales:36000000,
        total_number_of_buyers:20,top5_buyers_sales:9000000,largest_buyer_sales:2200000,
        gov_buyer_sales:7000000,no_govt_buyers:8,large_private_buyer_sales:18000000,no_private_sector_buyer:6,
        small_buyer_sales:500000,no_small_buyer_sales:6,avg_payment_days_buyers:12,contract_coverage:17,
        raw_milk_purchase_cost:26000000,transport_cost:550000,
        salary_expense:1900000,admin_expense:450000,electricity_expense:280000,fuel_expense:180000,maintenance_expense:140000,rent_expense:100000,other_operating_expense:180000,
        depreciation:750000,amortization:100000,
        cash_on_hand:600000,bank_balance:5200000,accounts_receivable:700000,inventory:550000,prepaid_expense:100000,other_current_assets:180000,
        land_value:9000000,building_value:3500000,plant_machinery_value:2800000,vehicle_value:1600000,furniture_value:320000,other_fixed_assets:220000,
        accounts_payable:280000,short_term_loan:0,accrued_expense:90000,current_portion_long_term_debt:1000000,long_term_loan:4000000,other_long_term_liabilities:0,
        paid_up_capital:6000000,retained_earnings:5000000,reserves:2500000,
        total_milk_collected_liters:4000000,milk_loss_liters_during_collection:40000,loss_during_process:0,
        avg_monthly_milk_liters:333000,lowest_monthly_milk_liters:300000,highest_monthly_milk_liters:400000,
        average_inventory:380000,credit_period_given_days:7,top5_farmer_collection_liters:480000,highest_farmer_quantity_liters:70600,lowest_farmer_quantity_liters:240,credit_history_flag:'Timely',total_number_of_farmers:680,collection_days_positive:358,
        total_member_loans:8500000,npa_member_loans:85000,overdue_member_loans:120000,restructured_loans_past3yrs:'None',max_dpd_days:3,
        cash_bank_balance_last_year:5800000,cash_bank_balance_previous_year:4500000,
        audit_findings_count:'None',key_mgmt_avg_experience_years:15,internal_control_score:'Robust',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards and documents exist. मापदण्ड र दस्तावेज छन्',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Full',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:2,
        meeting_frequency:'Weekly',member_info_transparency:'Always',fund_usage:'Buying Milk',kyc_aml:'Easily Found',income_expense_checked:'Regularly',right_to_information:'Always Beforehand',community_support_level:'Frequently',emergency_response:'Proper Plan'
    },

    col_existing_b: {
        _label:'Collection Only — Existing Customer',_sublabel:'B Risk ~710 pts',_color:'#2563eb',_modelType:'collection',_customerType:'existing',
        coop_name:'Terai Dairy Coop — ColEx B (Test)',years_operation:9,office_location:'Birgunj, Madhesh',
        existing_loan_amt:1500000,proposed_loan_amt:3500000,interest_rate:11,loan_tenure_months:48,repayment_frequency:'Monthly',
        milk_sales:20000000,product_sales:1000000,other_sales:200000,grant_income:600000,bank_sales:14000000,
        total_number_of_buyers:30,top5_buyers_sales:7500000,largest_buyer_sales:3200000,
        gov_buyer_sales:3500000,no_govt_buyers:8,large_private_buyer_sales:9000000,no_private_sector_buyer:7,
        small_buyer_sales:700000,no_small_buyer_sales:15,avg_payment_days_buyers:32,contract_coverage:19,
        raw_milk_purchase_cost:14000000,transport_cost:380000,
        salary_expense:1100000,admin_expense:280000,electricity_expense:180000,fuel_expense:140000,maintenance_expense:90000,rent_expense:75000,other_operating_expense:110000,
        depreciation:450000,amortization:70000,
        cash_on_hand:180000,bank_balance:2200000,accounts_receivable:1300000,inventory:750000,prepaid_expense:45000,other_current_assets:90000,
        land_value:3800000,building_value:1400000,plant_machinery_value:1100000,vehicle_value:750000,furniture_value:140000,other_fixed_assets:90000,
        accounts_payable:450000,short_term_loan:0,accrued_expense:180000,current_portion_long_term_debt:700000,long_term_loan:2800000,other_long_term_liabilities:0,
        paid_up_capital:2200000,retained_earnings:1300000,reserves:700000,
        total_milk_collected_liters:2000000,milk_loss_liters_during_collection:42000,loss_during_process:0,
        avg_monthly_milk_liters:166000,lowest_monthly_milk_liters:133000,highest_monthly_milk_liters:200000,
        average_inventory:560000,credit_period_given_days:15,top5_farmer_collection_liters:380000,highest_farmer_quantity_liters:52600,lowest_farmer_quantity_liters:160,credit_history_flag:'With few delays',total_number_of_farmers:380,collection_days_positive:328,
        total_member_loans:4800000,npa_member_loans:290000,overdue_member_loans:380000,restructured_loans_past3yrs:'None',max_dpd_days:7,
        cash_bank_balance_last_year:2380000,cash_bank_balance_previous_year:1900000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:8,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:5,
        meeting_frequency:'Monthly',member_info_transparency:'Mostly',fund_usage:'Buying Milk',kyc_aml:'Mostly',income_expense_checked:'Regularly',right_to_information:'Mostly Beforehand',community_support_level:'Sometimes',emergency_response:'Normal'
    },

    col_existing_c: {
        _label:'Collection Only — Existing Customer',_sublabel:'C Risk ~575 pts',_color:'#d97706',_modelType:'collection',_customerType:'existing',
        coop_name:'Plains Dairy Coop — ColEx C (Test)',years_operation:6,office_location:'Butwal, Lumbini',
        existing_loan_amt:2000000,proposed_loan_amt:4000000,interest_rate:13,loan_tenure_months:36,repayment_frequency:'Monthly',
        milk_sales:11000000,product_sales:600000,other_sales:200000,grant_income:400000,bank_sales:7500000,
        total_number_of_buyers:25,top5_buyers_sales:5500000,largest_buyer_sales:2600000,
        gov_buyer_sales:2800000,no_govt_buyers:5,large_private_buyer_sales:5500000,no_private_sector_buyer:5,
        small_buyer_sales:900000,no_small_buyer_sales:15,avg_payment_days_buyers:55,contract_coverage:13,
        raw_milk_purchase_cost:8000000,transport_cost:280000,
        salary_expense:750000,admin_expense:180000,electricity_expense:110000,fuel_expense:90000,maintenance_expense:70000,rent_expense:55000,other_operating_expense:90000,
        depreciation:280000,amortization:40000,
        cash_on_hand:120000,bank_balance:1100000,accounts_receivable:1300000,inventory:480000,prepaid_expense:25000,other_current_assets:70000,
        land_value:2200000,building_value:850000,plant_machinery_value:650000,vehicle_value:420000,furniture_value:105000,other_fixed_assets:80000,
        accounts_payable:550000,short_term_loan:500000,accrued_expense:230000,current_portion_long_term_debt:900000,long_term_loan:3600000,other_long_term_liabilities:300000,
        paid_up_capital:1100000,retained_earnings:600000,reserves:220000,
        total_milk_collected_liters:1000000,milk_loss_liters_during_collection:52000,loss_during_process:0,
        avg_monthly_milk_liters:83333,lowest_monthly_milk_liters:68000,highest_monthly_milk_liters:110000,
        average_inventory:380000,credit_period_given_days:30,top5_farmer_collection_liters:265000,highest_farmer_quantity_liters:42100,lowest_farmer_quantity_liters:130,credit_history_flag:'With few delays',total_number_of_farmers:190,collection_days_positive:305,
        total_member_loans:2800000,npa_member_loans:280000,overdue_member_loans:420000,restructured_loans_past3yrs:'Few Times',max_dpd_days:12,
        cash_bank_balance_last_year:1220000,cash_bank_balance_previous_year:980000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:6,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'Yes',storage_availability_flag:'No',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'No',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'High',
        credit_history_banks:'Watch List',dpd_days_banks:12,
        meeting_frequency:'Monthly',member_info_transparency:'Sometimes',fund_usage:'Buying Milk',kyc_aml:'Sometimes',income_expense_checked:'Occasionally',right_to_information:'Sometimes beforehand',community_support_level:'Sometimes',emergency_response:'Little Preparation'
    },

    col_existing_d: {
        _label:'Collection Only — Existing Customer',_sublabel:'D Risk ~280 pts',_color:'#b91c1c',_modelType:'collection',_customerType:'existing',
        coop_name:'Struggling Dairy Coop — ColEx D (Test)',years_operation:3,office_location:'Darchula, Sudurpashchim',
        existing_loan_amt:3000000,proposed_loan_amt:5000000,interest_rate:16,loan_tenure_months:24,repayment_frequency:'Annual',
        milk_sales:5500000,product_sales:0,other_sales:80000,grant_income:3500000,bank_sales:1200000,
        total_number_of_buyers:15,top5_buyers_sales:3800000,largest_buyer_sales:2400000,
        gov_buyer_sales:400000,no_govt_buyers:2,large_private_buyer_sales:1800000,no_private_sector_buyer:2,
        small_buyer_sales:1400000,no_small_buyer_sales:11,avg_payment_days_buyers:85,contract_coverage:2,
        raw_milk_purchase_cost:4500000,transport_cost:180000,
        salary_expense:550000,admin_expense:130000,electricity_expense:70000,fuel_expense:70000,maintenance_expense:55000,rent_expense:45000,other_operating_expense:70000,
        depreciation:180000,amortization:0,
        cash_on_hand:40000,bank_balance:160000,accounts_receivable:2200000,inventory:130000,prepaid_expense:0,other_current_assets:40000,
        land_value:900000,building_value:360000,plant_machinery_value:260000,vehicle_value:180000,furniture_value:55000,other_fixed_assets:35000,
        accounts_payable:1300000,short_term_loan:2200000,accrued_expense:450000,current_portion_long_term_debt:1250000,long_term_loan:5000000,other_long_term_liabilities:900000,
        paid_up_capital:250000,retained_earnings:-350000,reserves:40000,
        total_milk_collected_liters:500000,milk_loss_liters_during_collection:40000,loss_during_process:0,
        avg_monthly_milk_liters:41000,lowest_monthly_milk_liters:16000,highest_monthly_milk_liters:65000,
        average_inventory:110000,credit_period_given_days:60,top5_farmer_collection_liters:320000,highest_farmer_quantity_liters:40000,lowest_farmer_quantity_liters:130,credit_history_flag:'Frequent delays',total_number_of_farmers:75,collection_days_positive:250,
        total_member_loans:1400000,npa_member_loans:420000,overdue_member_loans:560000,restructured_loans_past3yrs:'Frequently',max_dpd_days:85,
        cash_bank_balance_last_year:200000,cash_bank_balance_previous_year:360000,
        audit_findings_count:'Qualified',key_mgmt_avg_experience_years:2,internal_control_score:'Weak',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'No',storage_availability_flag:'No',
        quality_sop_score_model_b:'No standards (मापदण्ड छैन)',
        insurance_coverage_flag:'No',digital_mis_flag:'No',regulatory_compliance_flag:'None',climatic_risk_score:'Medium',
        credit_history_banks:'Substandard',dpd_days_banks:30,
        meeting_frequency:'Annually',member_info_transparency:'Decided among few',fund_usage:'Other things',kyc_aml:'Hard',income_expense_checked:'Never',right_to_information:'Only after implementation',community_support_level:'Never',emergency_response:'Nothing'
    },

    // ══════════════════════════════════════════════════════════════════════════
    // GROUP 3 — Collection & Processing × New Customer
    // ══════════════════════════════════════════════════════════════════════════

    proc_new_a: {
        _label:'Coll. & Processing — New Customer',_sublabel:'A Risk ~860 pts',_color:'#16a34a',_modelType:'processing',_customerType:'new',
        coop_name:'Modern Dairy Coop — ProcNew A (Test)',years_operation:16,office_location:'Chitwan, Bagmati',
        existing_loan_amt:0,proposed_loan_amt:5000000,interest_rate:10,loan_tenure_months:60,repayment_frequency:'Monthly',
        milk_sales:35000000,product_sales:12000000,other_sales:1000000,grant_income:300000,bank_sales:42000000,
        total_number_of_buyers:20,top5_buyers_sales:12000000,largest_buyer_sales:3500000,
        gov_buyer_sales:9000000,no_govt_buyers:8,large_private_buyer_sales:22000000,no_private_sector_buyer:6,
        small_buyer_sales:700000,no_small_buyer_sales:6,avg_payment_days_buyers:12,contract_coverage:17,
        raw_milk_purchase_cost:24000000,processing_cost:5000000,packaging_cost:2000000,other_processing_cost:500000,
        transport_cost:800000,salary_expense:2500000,admin_expense:600000,electricity_expense:450000,fuel_expense:300000,maintenance_expense:200000,rent_expense:150000,other_operating_expense:250000,
        depreciation:1200000,amortization:150000,
        cash_on_hand:700000,bank_balance:6000000,accounts_receivable:900000,inventory:1200000,prepaid_expense:150000,other_current_assets:250000,
        land_value:10000000,building_value:5000000,plant_machinery_value:6000000,vehicle_value:2000000,furniture_value:400000,other_fixed_assets:300000,
        accounts_payable:400000,short_term_loan:0,accrued_expense:150000,current_portion_long_term_debt:1000000,long_term_loan:4000000,other_long_term_liabilities:0,
        paid_up_capital:8000000,retained_earnings:6000000,reserves:3000000,
        total_milk_collected_liters:3500000,milk_loss_liters_during_collection:35000,loss_during_process:21000,
        avg_monthly_milk_liters:291000,lowest_monthly_milk_liters:262000,highest_monthly_milk_liters:350000,
        average_inventory:800000,credit_period_given_days:7,top5_farmer_collection_liters:420000,highest_farmer_quantity_liters:70000,lowest_farmer_quantity_liters:230,credit_history_flag:'Timely',total_number_of_farmers:600,collection_days_positive:358,
        total_member_loans:10000000,npa_member_loans:100000,overdue_member_loans:150000,restructured_loans_past3yrs:'None',max_dpd_days:3,
        cash_bank_balance_last_year:6700000,cash_bank_balance_previous_year:5200000,
        audit_findings_count:'None',key_mgmt_avg_experience_years:14,internal_control_score:'Robust',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards and documents exist. मापदण्ड र दस्तावेज छन्',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Full',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Weekly',member_info_transparency:'Always',fund_usage:'Buying Milk',kyc_aml:'Easily Found',income_expense_checked:'Regularly',right_to_information:'Always Beforehand',community_support_level:'Frequently',emergency_response:'Proper Plan'
    },

    proc_new_b: {
        _label:'Coll. & Processing — New Customer',_sublabel:'B Risk ~715 pts',_color:'#2563eb',_modelType:'processing',_customerType:'new',
        coop_name:'Midhill Dairy Coop — ProcNew B (Test)',years_operation:8,office_location:'Dharan, Koshi',
        existing_loan_amt:0,proposed_loan_amt:6000000,interest_rate:12,loan_tenure_months:48,repayment_frequency:'Monthly',
        milk_sales:18000000,product_sales:6000000,other_sales:600000,grant_income:700000,bank_sales:18000000,
        total_number_of_buyers:30,top5_buyers_sales:8000000,largest_buyer_sales:3000000,
        gov_buyer_sales:4500000,no_govt_buyers:8,large_private_buyer_sales:11000000,no_private_sector_buyer:7,
        small_buyer_sales:900000,no_small_buyer_sales:15,avg_payment_days_buyers:28,contract_coverage:21,
        raw_milk_purchase_cost:12500000,processing_cost:2500000,packaging_cost:800000,other_processing_cost:300000,
        transport_cost:500000,salary_expense:1400000,admin_expense:350000,electricity_expense:280000,fuel_expense:200000,maintenance_expense:130000,rent_expense:100000,other_operating_expense:150000,
        depreciation:700000,amortization:100000,
        cash_on_hand:250000,bank_balance:3000000,accounts_receivable:1500000,inventory:900000,prepaid_expense:70000,other_current_assets:150000,
        land_value:5000000,building_value:2500000,plant_machinery_value:3500000,vehicle_value:1200000,furniture_value:200000,other_fixed_assets:150000,
        accounts_payable:600000,short_term_loan:0,accrued_expense:220000,current_portion_long_term_debt:1200000,long_term_loan:4800000,other_long_term_liabilities:0,
        paid_up_capital:3500000,retained_earnings:2000000,reserves:1000000,
        total_milk_collected_liters:1800000,milk_loss_liters_during_collection:45000,loss_during_process:27000,
        avg_monthly_milk_liters:150000,lowest_monthly_milk_liters:120000,highest_monthly_milk_liters:180000,
        average_inventory:650000,credit_period_given_days:15,top5_farmer_collection_liters:300000,highest_farmer_quantity_liters:51400,lowest_farmer_quantity_liters:150,credit_history_flag:'With few delays',total_number_of_farmers:350,collection_days_positive:332,
        total_member_loans:6000000,npa_member_loans:360000,overdue_member_loans:480000,restructured_loans_past3yrs:'None',max_dpd_days:9,
        cash_bank_balance_last_year:3250000,cash_bank_balance_previous_year:2600000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:9,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Monthly',member_info_transparency:'Mostly',fund_usage:'Buying Milk',kyc_aml:'Mostly',income_expense_checked:'Regularly',right_to_information:'Mostly Beforehand',community_support_level:'Sometimes',emergency_response:'Normal'
    },

    proc_new_c: {
        _label:'Coll. & Processing — New Customer',_sublabel:'C Risk ~565 pts',_color:'#d97706',_modelType:'processing',_customerType:'new',
        coop_name:'Valley Proc Coop — ProcNew C (Test)',years_operation:4,office_location:'Palpa, Lumbini',
        existing_loan_amt:0,proposed_loan_amt:7000000,interest_rate:14,loan_tenure_months:36,repayment_frequency:'Monthly',
        milk_sales:10000000,product_sales:3200000,other_sales:300000,grant_income:500000,bank_sales:9000000,
        total_number_of_buyers:25,top5_buyers_sales:6000000,largest_buyer_sales:3000000,
        gov_buyer_sales:2500000,no_govt_buyers:5,large_private_buyer_sales:6000000,no_private_sector_buyer:5,
        small_buyer_sales:1100000,no_small_buyer_sales:15,avg_payment_days_buyers:55,contract_coverage:13,
        raw_milk_purchase_cost:7000000,processing_cost:1200000,packaging_cost:400000,other_processing_cost:150000,
        transport_cost:350000,salary_expense:900000,admin_expense:220000,electricity_expense:150000,fuel_expense:110000,maintenance_expense:85000,rent_expense:65000,other_operating_expense:110000,
        depreciation:350000,amortization:50000,
        cash_on_hand:130000,bank_balance:1100000,accounts_receivable:1700000,inventory:600000,prepaid_expense:35000,other_current_assets:90000,
        land_value:2800000,building_value:1300000,plant_machinery_value:1900000,vehicle_value:650000,furniture_value:130000,other_fixed_assets:100000,
        accounts_payable:800000,short_term_loan:600000,accrued_expense:300000,current_portion_long_term_debt:1200000,long_term_loan:4800000,other_long_term_liabilities:500000,
        paid_up_capital:1400000,retained_earnings:700000,reserves:280000,
        total_milk_collected_liters:950000,milk_loss_liters_during_collection:50000,loss_during_process:38000,
        avg_monthly_milk_liters:79167,lowest_monthly_milk_liters:64000,highest_monthly_milk_liters:105000,
        average_inventory:500000,credit_period_given_days:30,top5_farmer_collection_liters:240000,highest_farmer_quantity_liters:42200,lowest_farmer_quantity_liters:130,credit_history_flag:'With few delays',total_number_of_farmers:180,collection_days_positive:305,
        total_member_loans:3200000,npa_member_loans:320000,overdue_member_loans:480000,restructured_loans_past3yrs:'Few Times',max_dpd_days:12,
        cash_bank_balance_last_year:1230000,cash_bank_balance_previous_year:980000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:5,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'Yes',storage_availability_flag:'No',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'No',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'High',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Monthly',member_info_transparency:'Sometimes',fund_usage:'Buying Milk',kyc_aml:'Sometimes',income_expense_checked:'Occasionally',right_to_information:'Sometimes beforehand',community_support_level:'Sometimes',emergency_response:'Little Preparation'
    },

    proc_new_d: {
        _label:'Coll. & Processing — New Customer',_sublabel:'D Risk ~290 pts',_color:'#b91c1c',_modelType:'processing',_customerType:'new',
        coop_name:'Weak Proc Coop — ProcNew D (Test)',years_operation:1,office_location:'Humla, Karnali',
        existing_loan_amt:0,proposed_loan_amt:8000000,interest_rate:16,loan_tenure_months:24,repayment_frequency:'Annual',
        milk_sales:5000000,product_sales:800000,other_sales:100000,grant_income:4500000,bank_sales:1800000,
        total_number_of_buyers:15,top5_buyers_sales:4000000,largest_buyer_sales:2600000,
        gov_buyer_sales:500000,no_govt_buyers:2,large_private_buyer_sales:2000000,no_private_sector_buyer:2,
        small_buyer_sales:1500000,no_small_buyer_sales:11,avg_payment_days_buyers:90,contract_coverage:3,
        raw_milk_purchase_cost:4000000,processing_cost:300000,packaging_cost:150000,other_processing_cost:80000,
        transport_cost:250000,salary_expense:700000,admin_expense:180000,electricity_expense:100000,fuel_expense:90000,maintenance_expense:70000,rent_expense:55000,other_operating_expense:90000,
        depreciation:250000,amortization:0,
        cash_on_hand:60000,bank_balance:250000,accounts_receivable:2400000,inventory:200000,prepaid_expense:0,other_current_assets:60000,
        land_value:1200000,building_value:600000,plant_machinery_value:700000,vehicle_value:280000,furniture_value:70000,other_fixed_assets:50000,
        accounts_payable:1400000,short_term_loan:2500000,accrued_expense:500000,current_portion_long_term_debt:1600000,long_term_loan:6400000,other_long_term_liabilities:1200000,
        paid_up_capital:400000,retained_earnings:-250000,reserves:60000,
        total_milk_collected_liters:600000,milk_loss_liters_during_collection:48000,loss_during_process:36000,
        avg_monthly_milk_liters:50000,lowest_monthly_milk_liters:20000,highest_monthly_milk_liters:75000,
        average_inventory:160000,credit_period_given_days:60,top5_farmer_collection_liters:380000,highest_farmer_quantity_liters:36000,lowest_farmer_quantity_liters:120,credit_history_flag:'Frequent delays',total_number_of_farmers:100,collection_days_positive:260,
        total_member_loans:2200000,npa_member_loans:660000,overdue_member_loans:880000,restructured_loans_past3yrs:'Frequently',max_dpd_days:100,
        cash_bank_balance_last_year:310000,cash_bank_balance_previous_year:500000,
        audit_findings_count:'Qualified',key_mgmt_avg_experience_years:1,internal_control_score:'Weak',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'No',storage_availability_flag:'No',
        quality_sop_score_model_b:'No standards (मापदण्ड छैन)',
        insurance_coverage_flag:'No',digital_mis_flag:'No',regulatory_compliance_flag:'None',climatic_risk_score:'Medium',
        credit_history_banks:'Pass',dpd_days_banks:0,
        meeting_frequency:'Annually',member_info_transparency:'Decided among few',fund_usage:'Other things',kyc_aml:'Hard',income_expense_checked:'Never',right_to_information:'Only after implementation',community_support_level:'Never',emergency_response:'Nothing'
    },

    // ══════════════════════════════════════════════════════════════════════════
    // GROUP 4 — Collection & Processing × Existing Customer
    // ══════════════════════════════════════════════════════════════════════════

    proc_existing_a: {
        _label:'Coll. & Processing — Existing Customer',_sublabel:'A Risk ~855 pts',_color:'#16a34a',_modelType:'processing',_customerType:'existing',
        coop_name:'Premier Dairy Coop — ProcEx A (Test)',years_operation:18,office_location:'Biratnagar, Koshi',
        existing_loan_amt:3000000,proposed_loan_amt:5000000,interest_rate:10,loan_tenure_months:60,repayment_frequency:'Monthly',
        milk_sales:32000000,product_sales:11000000,other_sales:900000,grant_income:250000,bank_sales:40000000,
        total_number_of_buyers:20,top5_buyers_sales:11000000,largest_buyer_sales:3200000,
        gov_buyer_sales:8500000,no_govt_buyers:8,large_private_buyer_sales:20000000,no_private_sector_buyer:6,
        small_buyer_sales:650000,no_small_buyer_sales:6,avg_payment_days_buyers:12,contract_coverage:18,
        raw_milk_purchase_cost:22000000,processing_cost:4500000,packaging_cost:1800000,other_processing_cost:450000,
        transport_cost:750000,salary_expense:2300000,admin_expense:550000,electricity_expense:420000,fuel_expense:280000,maintenance_expense:185000,rent_expense:140000,other_operating_expense:230000,
        depreciation:1100000,amortization:140000,
        cash_on_hand:650000,bank_balance:5800000,accounts_receivable:850000,inventory:1100000,prepaid_expense:130000,other_current_assets:230000,
        land_value:9500000,building_value:4800000,plant_machinery_value:5500000,vehicle_value:1900000,furniture_value:380000,other_fixed_assets:280000,
        accounts_payable:380000,short_term_loan:0,accrued_expense:140000,current_portion_long_term_debt:1600000,long_term_loan:6400000,other_long_term_liabilities:0,
        paid_up_capital:9000000,retained_earnings:7000000,reserves:3500000,
        total_milk_collected_liters:3200000,milk_loss_liters_during_collection:32000,loss_during_process:19000,
        avg_monthly_milk_liters:266000,lowest_monthly_milk_liters:239000,highest_monthly_milk_liters:320000,
        average_inventory:750000,credit_period_given_days:7,top5_farmer_collection_liters:384000,highest_farmer_quantity_liters:66200,lowest_farmer_quantity_liters:220,credit_history_flag:'Timely',total_number_of_farmers:580,collection_days_positive:358,
        total_member_loans:9500000,npa_member_loans:95000,overdue_member_loans:140000,restructured_loans_past3yrs:'None',max_dpd_days:3,
        cash_bank_balance_last_year:6450000,cash_bank_balance_previous_year:5000000,
        audit_findings_count:'None',key_mgmt_avg_experience_years:16,internal_control_score:'Robust',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards and documents exist. मापदण्ड र दस्तावेज छन्',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Full',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:2,
        meeting_frequency:'Weekly',member_info_transparency:'Always',fund_usage:'Buying Milk',kyc_aml:'Easily Found',income_expense_checked:'Regularly',right_to_information:'Always Beforehand',community_support_level:'Frequently',emergency_response:'Proper Plan'
    },

    proc_existing_b: {
        _label:'Coll. & Processing — Existing Customer',_sublabel:'B Risk ~710 pts',_color:'#2563eb',_modelType:'processing',_customerType:'existing',
        coop_name:'Active Proc Coop — ProcEx B (Test)',years_operation:10,office_location:'Dhankuta, Koshi',
        existing_loan_amt:2500000,proposed_loan_amt:5500000,interest_rate:12,loan_tenure_months:48,repayment_frequency:'Monthly',
        milk_sales:16000000,product_sales:5500000,other_sales:550000,grant_income:800000,bank_sales:17000000,
        total_number_of_buyers:30,top5_buyers_sales:7500000,largest_buyer_sales:2900000,
        gov_buyer_sales:4200000,no_govt_buyers:8,large_private_buyer_sales:10500000,no_private_sector_buyer:7,
        small_buyer_sales:850000,no_small_buyer_sales:15,avg_payment_days_buyers:30,contract_coverage:20,
        raw_milk_purchase_cost:11000000,processing_cost:2200000,packaging_cost:700000,other_processing_cost:250000,
        transport_cost:480000,salary_expense:1300000,admin_expense:320000,electricity_expense:260000,fuel_expense:190000,maintenance_expense:120000,rent_expense:95000,other_operating_expense:140000,
        depreciation:650000,amortization:90000,
        cash_on_hand:230000,bank_balance:2800000,accounts_receivable:1400000,inventory:850000,prepaid_expense:65000,other_current_assets:140000,
        land_value:4800000,building_value:2300000,plant_machinery_value:3200000,vehicle_value:1100000,furniture_value:190000,other_fixed_assets:140000,
        accounts_payable:560000,short_term_loan:0,accrued_expense:210000,current_portion_long_term_debt:1100000,long_term_loan:4400000,other_long_term_liabilities:0,
        paid_up_capital:3200000,retained_earnings:1800000,reserves:900000,
        total_milk_collected_liters:1600000,milk_loss_liters_during_collection:40000,loss_during_process:24000,
        avg_monthly_milk_liters:133000,lowest_monthly_milk_liters:106000,highest_monthly_milk_liters:160000,
        average_inventory:600000,credit_period_given_days:15,top5_farmer_collection_liters:272000,highest_farmer_quantity_liters:50000,lowest_farmer_quantity_liters:150,credit_history_flag:'With few delays',total_number_of_farmers:320,collection_days_positive:330,
        total_member_loans:5500000,npa_member_loans:330000,overdue_member_loans:440000,restructured_loans_past3yrs:'None',max_dpd_days:8,
        cash_bank_balance_last_year:3030000,cash_bank_balance_previous_year:2400000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:10,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'Yes',fleet_availability_percent:'Yes',storage_availability_flag:'Yes',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'Yes',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'Low',
        credit_history_banks:'Pass',dpd_days_banks:5,
        meeting_frequency:'Monthly',member_info_transparency:'Mostly',fund_usage:'Buying Milk',kyc_aml:'Mostly',income_expense_checked:'Regularly',right_to_information:'Mostly Beforehand',community_support_level:'Sometimes',emergency_response:'Normal'
    },

    proc_existing_c: {
        _label:'Coll. & Processing — Existing Customer',_sublabel:'C Risk ~560 pts',_color:'#d97706',_modelType:'processing',_customerType:'existing',
        coop_name:'Struggling Proc Coop — ProcEx C (Test)',years_operation:5,office_location:'Ilam, Koshi',
        existing_loan_amt:2500000,proposed_loan_amt:6000000,interest_rate:14,loan_tenure_months:36,repayment_frequency:'Monthly',
        milk_sales:9000000,product_sales:2800000,other_sales:280000,grant_income:500000,bank_sales:7800000,
        total_number_of_buyers:25,top5_buyers_sales:5500000,largest_buyer_sales:2800000,
        gov_buyer_sales:2500000,no_govt_buyers:5,large_private_buyer_sales:5500000,no_private_sector_buyer:5,
        small_buyer_sales:1000000,no_small_buyer_sales:15,avg_payment_days_buyers:55,contract_coverage:13,
        raw_milk_purchase_cost:6500000,processing_cost:1100000,packaging_cost:380000,other_processing_cost:140000,
        transport_cost:330000,salary_expense:850000,admin_expense:210000,electricity_expense:140000,fuel_expense:105000,maintenance_expense:80000,rent_expense:62000,other_operating_expense:105000,
        depreciation:330000,amortization:45000,
        cash_on_hand:130000,bank_balance:1050000,accounts_receivable:1700000,inventory:580000,prepaid_expense:30000,other_current_assets:85000,
        land_value:2500000,building_value:1200000,plant_machinery_value:1800000,vehicle_value:630000,furniture_value:125000,other_fixed_assets:95000,
        accounts_payable:780000,short_term_loan:600000,accrued_expense:300000,current_portion_long_term_debt:850000,long_term_loan:3400000,other_long_term_liabilities:300000,
        paid_up_capital:1300000,retained_earnings:500000,reserves:180000,
        total_milk_collected_liters:880000,milk_loss_liters_during_collection:46000,loss_during_process:35000,
        avg_monthly_milk_liters:73333,lowest_monthly_milk_liters:58000,highest_monthly_milk_liters:98000,
        average_inventory:470000,credit_period_given_days:30,top5_farmer_collection_liters:230000,highest_farmer_quantity_liters:41400,lowest_farmer_quantity_liters:130,credit_history_flag:'With few delays',total_number_of_farmers:170,collection_days_positive:300,
        total_member_loans:3000000,npa_member_loans:300000,overdue_member_loans:450000,restructured_loans_past3yrs:'Few Times',max_dpd_days:12,
        cash_bank_balance_last_year:1180000,cash_bank_balance_previous_year:950000,
        audit_findings_count:'Few',key_mgmt_avg_experience_years:5,internal_control_score:'Adequate',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'Yes',storage_availability_flag:'No',
        quality_sop_score_model_b:'Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन',
        insurance_coverage_flag:'No',digital_mis_flag:'Yes',regulatory_compliance_flag:'Partial',climatic_risk_score:'High',
        credit_history_banks:'Watch List',dpd_days_banks:15,
        meeting_frequency:'Monthly',member_info_transparency:'Sometimes',fund_usage:'Buying Milk',kyc_aml:'Sometimes',income_expense_checked:'Occasionally',right_to_information:'Sometimes beforehand',community_support_level:'Sometimes',emergency_response:'Little Preparation'
    },

    proc_existing_d: {
        _label:'Coll. & Processing — Existing Customer',_sublabel:'D Risk ~290 pts',_color:'#b91c1c',_modelType:'processing',_customerType:'existing',
        coop_name:'Failing Proc Coop — ProcEx D (Test)',years_operation:1,office_location:'Remote District',
        existing_loan_amt:3000000,proposed_loan_amt:6000000,interest_rate:16,loan_tenure_months:36,repayment_frequency:'Annual',
        milk_sales:8000000,product_sales:0,other_sales:100000,grant_income:5000000,bank_sales:2000000,
        total_number_of_buyers:15,top5_buyers_sales:6500000,largest_buyer_sales:4000000,
        gov_buyer_sales:500000,no_govt_buyers:2,large_private_buyer_sales:3000000,no_private_sector_buyer:2,
        small_buyer_sales:2000000,no_small_buyer_sales:11,avg_payment_days_buyers:90,contract_coverage:3,
        raw_milk_purchase_cost:7000000,processing_cost:400000,packaging_cost:200000,other_processing_cost:100000,
        transport_cost:300000,salary_expense:900000,admin_expense:300000,electricity_expense:150000,fuel_expense:120000,maintenance_expense:80000,rent_expense:60000,other_operating_expense:200000,
        depreciation:200000,amortization:0,
        cash_on_hand:50000,bank_balance:350000,accounts_receivable:2500000,inventory:150000,prepaid_expense:0,other_current_assets:50000,
        land_value:1800000,building_value:600000,plant_machinery_value:400000,vehicle_value:300000,furniture_value:80000,other_fixed_assets:50000,
        accounts_payable:1500000,short_term_loan:3000000,accrued_expense:600000,current_portion_long_term_debt:1200000,long_term_loan:4800000,other_long_term_liabilities:1000000,
        paid_up_capital:500000,retained_earnings:-200000,reserves:100000,
        total_milk_collected_liters:700000,milk_loss_liters_during_collection:42000,loss_during_process:28000,
        avg_monthly_milk_liters:58000,lowest_monthly_milk_liters:20000,highest_monthly_milk_liters:90000,
        average_inventory:100000,credit_period_given_days:45,top5_farmer_collection_liters:420000,highest_farmer_quantity_liters:46700,lowest_farmer_quantity_liters:160,credit_history_flag:'Frequent delays',total_number_of_farmers:90,collection_days_positive:260,
        total_member_loans:2000000,npa_member_loans:600000,overdue_member_loans:800000,restructured_loans_past3yrs:'Frequently',max_dpd_days:120,
        cash_bank_balance_last_year:400000,cash_bank_balance_previous_year:700000,
        audit_findings_count:'Qualified',key_mgmt_avg_experience_years:1,internal_control_score:'Weak',
        lending_policy_compliance_flag:'No',fleet_availability_percent:'No',storage_availability_flag:'No',
        quality_sop_score_model_b:'No standards (मापदण्ड छैन)',
        insurance_coverage_flag:'No',digital_mis_flag:'No',regulatory_compliance_flag:'None',climatic_risk_score:'Medium',
        credit_history_banks:'Substandard',dpd_days_banks:45,
        meeting_frequency:'Annually',member_info_transparency:'Decided among few',fund_usage:'Other things',kyc_aml:'Hard',income_expense_checked:'Never',right_to_information:'Only after implementation',community_support_level:'Never',emergency_response:'Nothing'
    }
};

// ── Panel UI ──────────────────────────────────────────────────────────────────

function _initDevPanel() {
    if (document.getElementById('_devpanel')) return;
    const style = document.createElement('style');
    style.textContent = `
        #_devpanel{position:fixed;bottom:24px;right:24px;z-index:88888;font-family:'DM Sans',sans-serif}
        #_devpanel_btn{width:44px;height:44px;background:#1a1a1a;color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:18px;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
        #_devpanel_btn:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,.3)}
        #_devpanel_popup{display:none;position:absolute;bottom:54px;right:0;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:14px;min-width:320px;max-height:80vh;overflow-y:auto}
        #_devpanel_popup.open{display:block;animation:devPop .18s ease}
        @keyframes devPop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        ._devpanel_title{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:8px}
        ._devpanel_group{margin-bottom:10px}
        ._devpanel_group-label{font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#9ca3af;margin-bottom:4px;padding-left:2px}
        ._dp_row{display:flex;gap:4px;margin-bottom:4px}
        ._dp_btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 4px;border-radius:7px;border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;font-family:inherit;transition:all .15s;text-align:center}
        ._dp_btn:hover{background:#f3f4f6;border-color:#d1d5db}
        ._dp_dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-bottom:2px}
        ._dp_tier{font-size:11px;font-weight:700;color:#1a1a1a;line-height:1}
        ._dp_score{font-size:9px;color:#6b7280;font-weight:400}
        ._dp_divider{height:1px;background:#f3f4f6;margin:8px 0}
        ._dp_clear{width:100%;padding:7px 12px;border-radius:8px;border:1px solid #fca5a5;background:#fef2f2;cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;color:#b91c1c;transition:all .15s}
        ._dp_clear:hover{background:#fee2e2}
    `;
    document.head.appendChild(style);
    const panel = document.createElement('div');
    panel.id = '_devpanel';
    function tierBtn(key, color, tier, score) {
        return `<button class="_dp_btn" onclick="fillTestData('${key}')" title="${(TEST_PRESETS[key]||{})._label||''} — ${tier}">
            <span class="_dp_dot" style="background:${color}"></span>
            <span class="_dp_tier">${tier}</span>
            <span class="_dp_score">${score}</span>
        </button>`;
    }
    function group(label, a, b, c, d) {
        return `<div class="_devpanel_group">
            <div class="_devpanel_group-label">${label}</div>
            <div class="_dp_row">
                ${tierBtn(a,'#16a34a','A','~880')}
                ${tierBtn(b,'#2563eb','B','~720')}
                ${tierBtn(c,'#d97706','C','~540')}
                ${tierBtn(d,'#b91c1c','D','~290')}
            </div>
        </div>`;
    }
    panel.innerHTML = `
        <div id="_devpanel_popup">
            <div class="_devpanel_title">⚡ Quick Test Data — 16 Presets</div>
            ${group('Collection Only &bull; New Customer',      'col_new_a',      'col_new_b',      'col_new_c',      'col_new_d')}
            ${group('Collection Only &bull; Existing Customer', 'col_existing_a', 'col_existing_b', 'col_existing_c', 'col_existing_d')}
            ${group('Coll. &amp; Processing &bull; New',        'proc_new_a',     'proc_new_b',     'proc_new_c',     'proc_new_d')}
            ${group('Coll. &amp; Processing &bull; Existing',   'proc_existing_a','proc_existing_b','proc_existing_c','proc_existing_d')}
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

document.addEventListener('click', function(e) {
    const panel = document.getElementById('_devpanel');
    if (panel && !panel.contains(e.target))
        document.getElementById('_devpanel_popup')?.classList.remove('open');
});

async function fillTestData(presetKey) {
    const data = TEST_PRESETS[presetKey];
    if (!data) return;
    document.getElementById('_devpanel_popup')?.classList.remove('open');
    if (typeof setCoopType     === 'function') setCoopType(data._modelType);
    if (typeof setCustomerType === 'function') setCustomerType(data._customerType);
    if (typeof navigateTo === 'function') navigateTo('questions');
    await _waitForQuestionsDOM();
    var filled = 0, missing = [];
    Object.entries(data).forEach(function([id, val]) {
        if (id.startsWith('_')) return;
        const el = document.getElementById(id);
        if (!el) { missing.push(id); return; }
        el.value = val;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
    });
    if (typeof calculateTotalLoan    === 'function') calculateTotalLoan();
    if (typeof calculateRevenue      === 'function') calculateRevenue();
    if (typeof calculateBuyerShares  === 'function') calculateBuyerShares();
    if (typeof calculateExpenses     === 'function') calculateExpenses();
    if (typeof calculateAssets       === 'function') calculateAssets();
    if (typeof calculateLiabilities  === 'function') calculateLiabilities();
    if (typeof calculateNetWorth     === 'function') calculateNetWorth();
    if (typeof calculateMilkMetrics  === 'function') calculateMilkMetrics();
    if (missing.length) console.warn('[devtools] Not found in DOM:', missing);
    if (typeof showToast === 'function')
        showToast('Filled ' + filled + ' fields — ' + data._label + ' ' + data._sublabel, 'success');
}

function _waitForQuestionsDOM() {
    return new Promise(function(resolve) {
        var tries = 0, MAX = 40;
        (function check() {
            var c = document.getElementById('questions_container');
            if ((c && c.querySelectorAll('input,select').length > 0) || tries++ >= MAX) return resolve();
            setTimeout(check, 50);
        })();
    });
}

function clearTestData() {
    document.querySelectorAll('#questions_container input, #questions_container select')
        .forEach(function(el) {
            if (el.type === 'select-one') el.selectedIndex = 0;
            else el.value = '';
        });
    document.getElementById('_devpanel_popup')?.classList.remove('open');
    if (typeof showToast === 'function') showToast('All fields cleared.', 'info');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(_initDevPanel, 300);
});