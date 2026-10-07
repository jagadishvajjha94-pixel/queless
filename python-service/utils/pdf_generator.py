from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import os

def generate_token_pdf(
    filepath: str,
    token_code: str,
    business_name: str,
    service_name: str,
    token_number: int,
    joined_at: str,
    estimated_wait_time: int,
    qr_code_url: str = ""
):
    """
    Generates a professional PDF token sheet using ReportLab.
    """
    # 1. Create document
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TokenTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'), # Slate 900
        alignment=1 # Center
    )
    
    subtitle_style = ParagraphStyle(
        'TokenSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#64748B'), # Slate 500
        alignment=1 # Center
    )
    
    code_style = ParagraphStyle(
        'TokenCode',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=36,
        leading=42,
        textColor=colors.HexColor('#2563EB'), # Blue 600
        alignment=1 # Center
    )
    
    label_style = ParagraphStyle(
        'TokenLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor('#475569') # Slate 600
    )
    
    value_style = ParagraphStyle(
        'TokenValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor('#0F172A') # Slate 900
    )

    # 2. Add Header / Brand
    story.append(Paragraph("QueueLess", title_style))
    story.append(Paragraph("Your Digital Queue Companion", subtitle_style))
    story.append(Spacer(1, 20))
    
    # 3. Main Ticket Code Card (Table structure)
    card_data = [
        [Paragraph(f"<b>{business_name}</b>", ParagraphStyle('BizName', parent=title_style, fontSize=16, leading=20))],
        [Paragraph(f"Service: {service_name}", subtitle_style)],
        [Spacer(1, 10)],
        [Paragraph(token_code, code_style)],
        [Paragraph(f"Queue Token #{token_number}", subtitle_style)],
        [Spacer(1, 15)]
    ]
    
    card_table = Table(card_data, colWidths=[400])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')), # Slate 50
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
        ('TOPPADDING', (0,0), (-1,-1), 15),
    ]))
    
    story.append(card_table)
    story.append(Spacer(1, 25))
    
    # 4. Details Table (Left) and QR Code (Right)
    # Check if QR code is locally saved (which it should be in static/qrcodes/<token_code>.png)
    qr_local_path = os.path.join("static", "qrcodes", f"{token_code}.png")
    
    details_data = [
        [Paragraph("Estimated Wait Time", label_style), Paragraph(f"{estimated_wait_time} minutes", value_style)],
        [Paragraph("Joined At", label_style), Paragraph(joined_at.split('T')[0] + ' ' + joined_at.split('T')[1][:8], value_style)],
        [Paragraph("Status", label_style), Paragraph("Waiting (Active)", value_style)],
        [Paragraph("Support", label_style), Paragraph("support@queueless.com", value_style)]
    ]
    
    details_table = Table(details_data, colWidths=[150, 150])
    details_table.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#F1F5F9')),
    ]))
    
    if os.path.exists(qr_local_path):
        qr_flowable = Image(qr_local_path, width=120, height=120)
        # Create a horizontal layouts table with Details and QR side-by-side
        horiz_data = [[details_table, qr_flowable]]
        horiz_table = Table(horiz_data, colWidths=[310, 130])
        horiz_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        story.append(horiz_table)
    else:
        story.append(details_table)
        
    story.append(Spacer(1, 40))
    
    # 5. Footer info
    footer_style = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        textColor=colors.HexColor('#94A3B8'),
        alignment=1
    )
    story.append(Paragraph("Please present this PDF token or scan the QR code at the service counter when your number is called.", footer_style))
    story.append(Paragraph("Powered by QueueLess © 2026. All rights reserved.", footer_style))
    
    doc.build(story)
