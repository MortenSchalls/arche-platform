import re
def archē(s):
    """Visible brand text: Arche -> Archē. Code names (ARCHE_ASSETS, SALT, file names with _ or -) are left alone."""
    s = re.sub(r'(?<![\w/.-])Arche(?![\w-]*\.(?:html|png|pdf|docx|xlsx|pptx|js))(?=[\s\\\'’,.;:)!?·"<\-]|$)', 'Archē', s)
    s = re.sub(r'ARCHE EXECUTIVE', 'ARCHĒ EXECUTIVE', s)
    return s
