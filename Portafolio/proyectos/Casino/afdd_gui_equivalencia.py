import sys
from collections import deque
from typing import Dict, Set, Tuple, List
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget,
    QLabel, QLineEdit, QTextEdit, QPushButton,
    QGridLayout, QHBoxLayout, QVBoxLayout, QGroupBox,
    QMessageBox, QSizePolicy, QFrame, QSplitter
)
from PyQt5.QtCore import Qt, QSize
from PyQt5.QtGui import QFont, QColor, QPalette

# ==========================================
# 1. LÓGICA DEL AUTOMATA (Backend)
# ==========================================

class DFA:
    def __init__(self, states: Set[str], alphabet: Set[str],
                 start_state: str, accept_states: Set[str],
                 transitions: Dict[Tuple[str, str], str], name: str = "AFD"):
        self.name = name
        self.states = states
        self.alphabet = alphabet
        self.start_state = start_state
        self.accept_states = accept_states
        self.transitions = transitions

    def is_complete(self) -> bool:
        for q in self.states:
            for a in self.alphabet:
                if (q, a) not in self.transitions:
                    return False
        return True

    def complete_with_sink(self):
        if self.is_complete():
            return
        sink = "SINK_STATE"
        if sink not in self.states:
            self.states.add(sink)
        for a in self.alphabet:
            if (sink, a) not in self.transitions:
                self.transitions[(sink, a)] = sink
        for q in list(self.states):
            for a in self.alphabet:
                if (q, a) not in self.transitions:
                    self.transitions[(q, a)] = sink

    def accepts(self, word: str) -> bool:
        current = self.start_state
        for ch in word:
            if (current, ch) not in self.transitions:
                return False
            current = self.transitions[(current, ch)]
        return current in self.accept_states

def reconstruct_word(parent, start, end) -> str:
    path: List[str] = []
    current = end
    while current != start:
        if current not in parent:
            break
        prev, symbol = parent[current]
        path.append(symbol)
        current = prev
    path.reverse()
    return "".join(path)

def are_equivalent(dfa1: DFA, dfa2: DFA):
    # Algoritmo BFS de equivalencia
    union_alphabet = dfa1.alphabet.union(dfa2.alphabet)
    dfa1.alphabet = union_alphabet
    dfa2.alphabet = union_alphabet
    dfa1.complete_with_sink()
    dfa2.complete_with_sink()
    
    start_pair = (dfa1.start_state, dfa2.start_state)
    queue = deque([start_pair])
    visited = {start_pair}
    parent: Dict[Tuple[str, str], Tuple[Tuple[str, str], str]] = {}
    
    while queue:
        q1, q2 = queue.popleft()
        in1 = q1 in dfa1.accept_states
        in2 = q2 in dfa2.accept_states
        
        if in1 != in2:
            word = reconstruct_word(parent, start_pair, (q1, q2))
            return False, word
            
        for a in union_alphabet:
            next1 = dfa1.transitions.get((q1, a))
            next2 = dfa2.transitions.get((q2, a))
            
            if next1 is None or next2 is None: continue
            
            pair = (next1, next2)
            if pair not in visited:
                visited.add(pair)
                queue.append(pair)
                parent[pair] = ((q1, q2), a)
                
    return True, None

# ==========================================
# 2. COMPONENTES DE INTERFAZ (UI Components)
# ==========================================

class DFAInputPanel(QGroupBox):
    """
    Componente reutilizable para la entrada de datos de un AFD.
    Esto evita duplicar código para AFD 1 y AFD 2.
    """
    def __init__(self, title, parent=None):
        super().__init__(title, parent)
        self.init_ui()

    def init_ui(self):
        layout = QGridLayout(self)
        layout.setVerticalSpacing(15)
        layout.setHorizontalSpacing(10)

        # Campos con tooltips y placeholders explicativos
        self.states = self.create_input("q0, q1, q2", "Estados (separados por coma):")
        self.alphabet = self.create_input("0, 1", "Alfabeto (separado por coma):")
        self.start = self.create_input("q0", "Estado Inicial:")
        self.accept = self.create_input("q2", "Estados de Aceptación:")
        
        # Área de transiciones
        lbl_trans = QLabel("Transiciones (q,s->d):")
        lbl_trans.setObjectName("LabelSub") # Para estilo CSS específico
        self.trans = QTextEdit()
        self.trans.setPlaceholderText("Ejemplo:\nq0,0->q1\nq0,1->q0")
        self.trans.setFixedHeight(120)

        # Colocación en Grid
        layout.addWidget(QLabel("Conjunto de Estados:"), 0, 0)
        layout.addWidget(self.states, 0, 1)
        
        layout.addWidget(QLabel("Alfabeto:"), 1, 0)
        layout.addWidget(self.alphabet, 1, 1)
        
        layout.addWidget(QLabel("Estado Inicial:"), 2, 0)
        layout.addWidget(self.start, 2, 1)
        
        layout.addWidget(QLabel("Estados Finales:"), 3, 0)
        layout.addWidget(self.accept, 3, 1)
        
        layout.addWidget(lbl_trans, 4, 0, 1, 2)
        layout.addWidget(self.trans, 5, 0, 1, 2)

    def create_input(self, placeholder, tooltip):
        le = QLineEdit()
        le.setPlaceholderText(placeholder)
        le.setToolTip(tooltip)
        return le

    def get_data(self):
        """Retorna un diccionario con los datos crudos"""
        return {
            "states": self.states.text(),
            "alphabet": self.alphabet.text(),
            "start": self.start.text(),
            "accept": self.accept.text(),
            "trans": self.trans.toPlainText()
        }

# ==========================================
# 3. VENTANA PRINCIPAL (Main Window)
# ==========================================

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Proyectolidia - Equivalencia de Autómatas")
        self.resize(1100, 750)
        self.init_ui()

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Layout principal vertical
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(20)

        # --- 1. Header ---
        header = QLabel("Verificador de Equivalencia de AFD")
        header.setObjectName("HeaderLabel")
        header.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(header)

        # --- 2. Área de Paneles (Splitter para resizable) ---
        splitter = QSplitter(Qt.Horizontal)
        
        self.panel1 = DFAInputPanel("Configuración AFD 1")
        self.panel2 = DFAInputPanel("Configuración AFD 2")
        
        splitter.addWidget(self.panel1)
        splitter.addWidget(self.panel2)
        splitter.setSizes([550, 550]) # Tamaño inicial igual
        
        main_layout.addWidget(splitter, 1) # Factor de estiramiento 1

        # --- 3. Barra de Control ---
        control_frame = QFrame()
        control_frame.setObjectName("ControlFrame")
        control_layout = QHBoxLayout(control_frame)
        control_layout.setContentsMargins(15, 15, 15, 15)

        lbl_test = QLabel("Cadena de prueba:")
        lbl_test.setStyleSheet("font-weight: bold; font-size: 14px;")
        
        self.entry_word = QLineEdit()
        self.entry_word.setPlaceholderText("Ej: 01010...")
        self.entry_word.setFixedWidth(200)

        btn_test = QPushButton("🧪 Probar Cadena")
        btn_test.setCursor(Qt.PointingHandCursor)
        btn_test.clicked.connect(self.action_test_word)
        btn_test.setObjectName("BtnSecondary")

        btn_equiv = QPushButton("⚡ Verificar Equivalencia")
        btn_equiv.setCursor(Qt.PointingHandCursor)
        btn_equiv.setFixedHeight(40)
        btn_equiv.clicked.connect(self.action_check_equivalence)
        btn_equiv.setObjectName("BtnPrimary")

        control_layout.addWidget(lbl_test)
        control_layout.addWidget(self.entry_word)
        control_layout.addWidget(btn_test)
        control_layout.addStretch() # Empuja el botón principal a la derecha
        control_layout.addWidget(btn_equiv)

        main_layout.addWidget(control_frame)

        # --- 4. Consola de Salida ---
        lbl_out = QLabel("Resultados del Análisis:")
        lbl_out.setStyleSheet("color: #AAAAAA; font-weight: bold; margin-top: 10px;")
        main_layout.addWidget(lbl_out)

        self.console = QTextEdit()
        self.console.setReadOnly(True)
        self.console.setObjectName("Console")
        self.console.setFixedHeight(150)
        main_layout.addWidget(self.console)

    # --- Lógica de Parseo ---

    def parse_dfa(self, panel: DFAInputPanel, name: str) -> DFA:
        data = panel.get_data()
        
        # Limpieza básica
        s_str = data['states'].strip()
        a_str = data['alphabet'].strip()
        start = data['start'].strip()
        acc_str = data['accept'].strip()
        trans_str = data['trans'].strip()

        if not (s_str and a_str and start):
            raise ValueError(f"<b>[{name}]</b> Faltan campos obligatorios.")

        states = {x.strip() for x in s_str.split(",") if x.strip()}
        alphabet = {x.strip() for x in a_str.split(",") if x.strip()}
        accept = {x.strip() for x in acc_str.split(",") if x.strip()}

        # Validaciones
        if start not in states:
            raise ValueError(f"<b>[{name}]</b> El estado inicial '{start}' no existe.")
        for s in accept:
            if s not in states:
                raise ValueError(f"<b>[{name}]</b> El estado final '{s}' no existe.")

        transitions = {}
        if trans_str:
            for i, line in enumerate(trans_str.splitlines()):
                line = line.strip()
                if not line: continue
                try:
                    if "->" not in line: raise Exception
                    left, right = line.split("->")
                    q, ch = left.split(",")
                    q = q.strip(); ch = ch.strip(); right = right.strip()
                    
                    if q not in states or right not in states:
                        raise ValueError(f"Estado desconocido en línea {i+1}")
                    if ch not in alphabet:
                        raise ValueError(f"Símbolo '{ch}' no está en alfabeto (línea {i+1})")
                        
                    transitions[(q, ch)] = right
                except ValueError as ve:
                    raise ve
                except Exception:
                    raise ValueError(f"<b>[{name}]</b> Error de sintaxis en línea {i+1}: <i>{line}</i>")

        dfa = DFA(states, alphabet, start, accept, transitions, name)
        dfa.complete_with_sink() # Auto-completar transiciones implícitas
        return dfa

    # --- Acciones ---

    def log(self, message, type="info"):
        color = "#CCCCCC"
        if type == "success": color = "#4EC9B0" # Verde suave
        if type == "error": color = "#F48771"   # Rojo suave
        if type == "warning": color = "#DCDCAA" # Amarillo
        
        self.console.append(f"<span style='color:{color};'>{message}</span>")
        # Scroll al final
        sb = self.console.verticalScrollBar()
        sb.setValue(sb.maximum())

    def get_both_dfas(self):
        try:
            d1 = self.parse_dfa(self.panel1, "AFD 1")
            d2 = self.parse_dfa(self.panel2, "AFD 2")
            return d1, d2
        except ValueError as e:
            self.log(f"Error de Configuración: {str(e)}", "error")
            QMessageBox.warning(self, "Error de Validación", str(e).replace("<b>","").replace("</b>",""))
            return None, None

    def action_test_word(self):
        d1, d2 = self.get_both_dfas()
        if not d1: return
        
        w = self.entry_word.text().strip()
        self.log(f"<br>--- Probando cadena: <b>'{w}'</b> ---", "info")
        
        r1 = d1.accepts(w)
        r2 = d2.accepts(w)
        
        res1 = "ACEPTA" if r1 else "RECHAZA"
        color1 = "success" if r1 else "error"
        
        res2 = "ACEPTA" if r2 else "RECHAZA"
        color2 = "success" if r2 else "error"

        self.log(f"AFD 1: {res1}", color1)
        self.log(f"AFD 2: {res2}", color2)
        
        if r1 == r2:
            self.log(">> CONCLUSIÓN: Coinciden en esta cadena.", "success")
        else:
            self.log(">> CONCLUSIÓN: Discrepancia encontrada.", "warning")

    def action_check_equivalence(self):
        self.console.clear()
        d1, d2 = self.get_both_dfas()
        if not d1: return

        self.log("Iniciando análisis de equivalencia...", "info")
        equiv, counter = are_equivalent(d1, d2)
        
        if equiv:
            self.log("<h1>✅ EQUIVALENTES</h1>", "success")
            self.log("Ambos autómatas aceptan exactamente el mismo lenguaje.", "success")
            QMessageBox.information(self, "Resultado", "Los AFD son EQUIVALENTES.")
        else:
            self.log("<h1>❌ NO EQUIVALENTES</h1>", "error")
            self.log(f"Se diferencian en la cadena: <b>'{counter}'</b>", "warning")
            self.log(f"AFD 1 acepta: {d1.accepts(counter)}", "info")
            self.log(f"AFD 2 acepta: {d2.accepts(counter)}", "info")
            QMessageBox.warning(self, "Resultado", f"No son equivalentes.\nContraejemplo: {counter}")

# ==========================================
# 4. ESTILOS Y EJECUCIÓN
# ==========================================

def main():
    app = QApplication(sys.argv)
    
    # --- Paleta de Estilo Dark Modern ---
    app.setStyle("Fusion")
    
    # Colores base
    dark_bg = "#1E1E1E"        # Fondo principal (gris muy oscuro)
    panel_bg = "#252526"       # Fondo de paneles
    text_color = "#D4D4D4"     # Texto gris claro
    accent_color = "#007ACC"   # Azul VS Code
    border_color = "#3E3E42"   # Bordes sutiles

    # Hoja de Estilos (CSS/QSS)
    qss = f"""
    QMainWindow {{
        background-color: {dark_bg};
    }}
    QWidget {{
        color: {text_color};
        font-family: 'Segoe UI', 'Roboto', 'Helvetica', sans-serif;
        font-size: 13px;
    }}
    QGroupBox {{
        background-color: {panel_bg};
        border: 1px solid {border_color};
        border-radius: 8px;
        margin-top: 22px;
        font-weight: bold;
    }}
    QGroupBox::title {{
        subcontrol-origin: margin;
        subcontrol-position: top left;
        padding: 5px 10px;
        background-color: {dark_bg};
        border: 1px solid {border_color};
        border-radius: 5px;
        color: {accent_color};
    }}
    QLineEdit, QTextEdit {{
        background-color: #3C3C3C;
        border: 1px solid {border_color};
        border-radius: 4px;
        color: white;
        padding: 4px;
        selection-background-color: {accent_color};
    }}
    QLineEdit:focus, QTextEdit:focus {{
        border: 1px solid {accent_color};
    }}
    QPushButton {{
        background-color: #333333;
        border: 1px solid {border_color};
        border-radius: 5px;
        padding: 6px 15px;
        color: white;
    }}
    QPushButton:hover {{
        background-color: #444444;
    }}
    QPushButton#BtnPrimary {{
        background-color: {accent_color};
        font-weight: bold;
        font-size: 14px;
    }}
    QPushButton#BtnPrimary:hover {{
        background-color: #0062A3;
    }}
    QPushButton#BtnSecondary {{
        border: 1px solid {accent_color};
        color: {accent_color};
        background-color: transparent;
    }}
    QPushButton#BtnSecondary:hover {{
        background-color: rgba(0, 122, 204, 0.1);
    }}
    QLabel#HeaderLabel {{
        font-size: 22px;
        font-weight: bold;
        color: {accent_color};
        margin-bottom: 10px;
    }}
    QTextEdit#Console {{
        background-color: #111111;
        border: 1px solid {border_color};
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 12px;
    }}
    """
    app.setStyleSheet(qss)

    win = MainWindow()
    win.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()