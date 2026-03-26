
from openpyxl import load_workbook
from openpyxl.drawing.image import Image

wb = load_workbook('UploadQRFile\\1748932922038-PCS -10. XF3Q1 bobbin & core assy1.xlsx')
ws = wb.worksheets[0]  # or specify by name: wb['Sheet1']

# Add QR code image
img = Image('UploadQRFile/1748932922043_qr.png')
img.width = 50
img.height = 50
ws.add_image(img, 'O1')

wb.save('UploadQRFile\\1748932922038-PCS -10. XF3Q1 bobbin & core assy1.xlsx_modified.xlsx')
    