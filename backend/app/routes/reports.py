from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.database.mongodb import cases_collection, evidence_collection, analysis_collection
from fpdf import FPDF

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/{case_id}/generate")
def generate_report_text(case_id: str):
    case = cases_collection.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    evidence_list = list(evidence_collection.find({"case_id": case_id}, {"_id": 0}))
    
    report = f"DIGITAL FORENSICS INVESTIGATION REPORT\n"
    report += f"====================================\n\n"
    report += f"Case ID: {case_id}\n"
    report += f"Title: {case.get('title', 'Unknown')}\n"
    report += f"Category: {case.get('crime_category', 'Unknown')}\n"
    report += f"Status: {case.get('status', 'Unknown')}\n\n"
    
    report += f"Evidence Summary:\n-----------------\n"
    for idx, ev in enumerate(evidence_list):
        report += f"{idx + 1}. {ev.get('evidence_name')} ({ev.get('evidence_type')})\n"
        # Fetch analysis
        analysis = analysis_collection.find_one({"evidence_id": ev.get("evidence_id")}, {"_id": 0})
        if analysis:
            report += f"   Risk Level: {analysis.get('risk_level', 'Unknown')}\n"
            report += f"   Suspicious Indicators: {analysis.get('indicator_count', 0)}\n"
        report += "\n"
        
    return {"report_text": report}


@router.get("/{case_id}/pdf")
def get_report_pdf(case_id: str):
    case = cases_collection.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    evidence_list = list(evidence_collection.find({"case_id": case_id}, {"_id": 0}))
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, "DIGITAL FORENSICS INVESTIGATION REPORT", new_x="LMARGIN", new_y="NEXT", align="C")
    
    pdf.set_font("helvetica", size=12)
    pdf.cell(0, 10, f"Case ID: {case_id}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 10, f"Title: {case.get('title', 'Unknown')}", new_x="LMARGIN", new_y="NEXT")
    
    pdf.cell(0, 10, "Evidence Items:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("helvetica", size=10)
    
    for ev in evidence_list:
        pdf.cell(0, 8, f"- {ev.get('evidence_name')} ({ev.get('evidence_type')})", new_x="LMARGIN", new_y="NEXT")
        analysis = analysis_collection.find_one({"evidence_id": ev.get("evidence_id")}, {"_id": 0})
        if analysis:
            pdf.cell(0, 8, f"   Risk Level: {analysis.get('risk_level', 'Unknown')}", new_x="LMARGIN", new_y="NEXT")
            
    pdf_output = pdf.output()
    
    return Response(
        content=bytes(pdf_output),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{case_id}.pdf"}
    )
