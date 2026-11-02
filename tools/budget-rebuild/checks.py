import openpyxl, copy
from openpyxl.styles import Font
wb=openpyxl.load_workbook('step7.xlsx')
ws=wb.create_sheet('Checks', wb.sheetnames.index('V1 vs V2 vs V3')+1)
ws['A1']='Checks (live in Excel): every line must say OK. If one says CHECK, stop and report it.'; ws['A1'].font=Font(bold=True)
rows=[
 ('Currency shown / factor used','=Inputs!$B$144&" × "&TEXT(Inputs!$B$143,"0.0000")',None),
 ('Summary Year 1 booking value = Annual B7','=IF(ABS(Summary!B5-Annual!B7)<1,"OK","CHECK")',None),
 ('Annual money lines (booking value, profit, costs, EBITDA, net, cash, dividends) = calculation × currency','=IF(ABS(SUM(Annual!B7:K8,Annual!B22:K23,Annual!B29:K31)-SUM(\'Annual USD\'!B7:K8,\'Annual USD\'!B22:K23,\'Annual USD\'!B29:K31)*Inputs!$B$143)<10,"OK","CHECK")',None),
 ('Monthly gross booking value (120 months) = calculation × currency','=IF(ABS(SUM(Monthly!B17:DQ17)-SUM(\'Monthly USD\'!B17:DQ17)*Inputs!$B$143)<10,"OK","CHECK")',None),
 ('Monthly brokers active = calculation (not converted)','=IF(SUM(Monthly!B7:DQ7)=SUM(\'Monthly USD\'!B7:DQ7),"OK","CHECK")',None),
 ('EBITDA = gross profit − operating costs (10 years)','=IF(ABS(SUM(\'Annual USD\'!B23:K23)-(SUM(\'Annual USD\'!B8:K8)-SUM(\'Annual USD\'!B22:K22)))<1,"OK","CHECK")',None),
 ('Spouse total = dividend + net salary (Year 1)','=IF(ABS(Summary!B13-(Summary!B10+Summary!B12))<1,"OK","CHECK")',None),
 ('Broker plan reached (Demand row 23, month 20)','=IF(Demand!U23=MIN(Inputs!$B$149,Inputs!$B$147+19*Inputs!$B$148),"OK","CHECK")',None),
 ('10-year net retained earnings (shown currency)','=SUM(Annual!B29:K29)','#,##0'),
]
for i,(a,f,fmt) in enumerate(rows,start=3):
  ws.cell(i,1,a); c=ws.cell(i,2,f)
  if fmt: c.number_format=fmt
ws.column_dimensions['A'].width=62; ws.column_dimensions['B'].width=26
wb.save('step8.xlsx'); print('ok')
