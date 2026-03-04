from jhora.ui.horo_chart_tabs import ChartTabbed
from PyQt6.QtWidgets import QApplication
import sys

def except_hook(cls, exception, traceback):
    print('Exception occurred:')
    import traceback as tb
    tb.print_exception(cls, exception, traceback)
    sys.__excepthook__(cls, exception, traceback)

if __name__ == "__main__":
    sys.excepthook = except_hook
    app = QApplication(sys.argv)
    
    # Initialize the main UI
    chart = ChartTabbed()
    chart.language('English')
    
    # Optional: Set a default date/time for computation if needed
    # chart.compute_horoscope() 
    
    chart.show()
    sys.exit(app.exec())
