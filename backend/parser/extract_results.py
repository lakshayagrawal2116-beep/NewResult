import sys
import json
import re
import pdfplumber

def extract_course_mappings(text):
    """
    Attempts to extract course code to course name mappings from raw text.
    Example: 'AM101 : MATHEMATICS-I  CO101 : PROGRAMMING FUNDAMENTALS'
    """
    mappings = {}
    # Find patterns like 'CODE : NAME' up to the next CODE or newline
    # This is a basic generic heuristic regex
    matches = re.finditer(r'([A-Z0-9a-z]+)\s*:\s*([A-Za-z0-9\s\-\&]+?)(?=\s+[A-Z0-9a-z]+\s*:|$)', text.replace('\n', ' '))
    for match in matches:
        code = match.group(1).strip()
        name = match.group(2).strip()
        if len(name) > 2:  # basic sanity check
            mappings[code] = name
    return mappings

def clean_value(val):
    if not val:
        return ""
    return str(val).replace('\n', ' ').strip()

def parse_pdf(pdf_path):
    students_data = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                raw_text = page.extract_text()
                course_mappings = extract_course_mappings(raw_text)
                
                last_header_data = None
                
                tables = page.extract_tables()
                if not tables:
                    continue
                
                for table in tables:
                    if len(table) < 1:
                        continue
                        
                    first_row = [clean_value(cell) for cell in table[0]]
                    
                    is_new_header = ('Roll No.' in first_row and 'Name of Student' in first_row)
                    
                    if is_new_header:
                        if len(table) < 3:
                            continue # Needs header, credit, and 1 data row
                        header_row = first_row
                        credits_row = [clean_value(cell) for cell in table[1]]
                        start_data_idx = 2
                        
                        try:
                            roll_idx = header_row.index('Roll No.')
                            name_idx = header_row.index('Name of Student')
                            sgpa_idx = header_row.index('SGPA')
                        except ValueError:
                            continue 
                            
                        try:
                            tc_idx = header_row.index('TC') 
                        except ValueError:
                            tc_idx = -1
                            
                        try:
                            fc_idx = header_row.index('Failed Courses')
                        except ValueError:
                            fc_idx = -1
                            
                        course_start_idx = name_idx + 1
                        course_end_idx = sgpa_idx
                        course_cols = []
                        for i in range(course_start_idx, course_end_idx):
                            code = header_row[i]
                            if not code:
                                continue
                            try:
                                credits = float(credits_row[i])
                            except ValueError:
                                credits = 0.0
                            course_cols.append({
                                'index': i, 'code': code, 'name': course_mappings.get(code, ""), 'credits': credits
                            })
                            
                        last_header_data = {
                            'roll_idx': roll_idx, 'name_idx': name_idx, 'sgpa_idx': sgpa_idx, 
                            'tc_idx': tc_idx, 'fc_idx': fc_idx, 'course_cols': course_cols
                        }
                    else:
                        if not last_header_data:
                            continue # We have no headers to use
                        # It's a continued table! Data starts at row 0
                        start_data_idx = 0
                        roll_idx = last_header_data['roll_idx']
                        name_idx = last_header_data['name_idx']
                        sgpa_idx = last_header_data['sgpa_idx']
                        tc_idx = last_header_data['tc_idx']
                        fc_idx = last_header_data['fc_idx']
                        course_cols = last_header_data['course_cols']
                    
                    # Parse Student Rows
                    for r in range(start_data_idx, len(table)):
                        row = [clean_value(cell) for cell in table[r]]
                        if not row or not any(row):
                            continue
                        if len(row) <= name_idx:
                            continue
                            
                        rollno = row[roll_idx]
                        name = row[name_idx]
                        
                        if not rollno or not name or rollno == "Roll No.":
                            continue
                            
                        try:
                            sgpa = float(row[sgpa_idx]) if row[sgpa_idx] not in ['...', '', '-'] else 0.0
                        except:
                            sgpa = 0.0
                            
                        total_credits = 0.0
                        if tc_idx != -1 and len(row) > tc_idx:
                            try:
                                total_credits = float(row[tc_idx])
                            except:
                                total_credits = 0.0
                                
                        failed_courses_str = row[fc_idx] if fc_idx != -1 and len(row) > fc_idx else ""
                        failed_list = [f.strip() for f in failed_courses_str.split(' ') if f.strip()]
                        
                        student_courses = []
                        for c in course_cols:
                            if len(row) > c['index']:
                                grade = row[c['index']]
                                if grade:
                                    student_courses.append({
                                        'courseCode': c['code'],
                                        'courseName': c['name'],
                                        'credits': c['credits'],
                                        'grade': grade
                                    })
                        
                        students_data.append({
                            'rollno': rollno, 'name': name, 'sgpa': sgpa,
                            'totalCredits': total_credits, 'failedCourses': failed_list,
                            'courses': student_courses
                        })
                        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
        
    # Output successful array of JSON objects
    print(json.dumps(students_data))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)
    parse_pdf(sys.argv[1])
