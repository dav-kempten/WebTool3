.. _frontend:

Frontend - Modul
================
Das Frontend-Modul beinhaltet alle Elemente für die äußere Darstellung der Eingabeformulare und wurde mittels dem Framework
`Angular <https://angular.io/>`_ erstellt. Angular ist ein von Google erstelltes Framework für die Erstellung von
Webanwendungen. Die Formulare des Frontends sind aus verschiedenen, voneinander unabhängigen Komponenten aufgebaut.


Dashboard
~~~~~~~~~
Das Dashboard ist die erste Seite, die man bei dem Aufruf des Webtools sieht. Nach Anmeldung mit dem eigenen Trainer-Konto
findet man hier prinzipielle Informationen zur Nutzung des Webtools und zwei Eingabemasken. Durch die Eingabemasken kann
der eingeloggte Trainer neue Touren und Kurse erstellen. Diese Komponente dient im Folgenden als Beispiel wie prinzipiell
die Formular-Komponenten aufgebaut sind.

Das Dashboard ist an sich eine eigene Angular-Komponente, die aus vielen statischen Elementen besteht. Die variablem
Formularfelder sind als ``FormControls`` definiert. Für die Erstellung wichtige Feldgruppen sind als ``FormGroup``
zusammengefasst.

.. code-block:: javascript

    export class DashboardComponent implements OnInit, OnDestroy {
        private destroySubject: Subject<boolean> = new Subject<boolean>();

        permissionHandler$: Observable<boolean>;
        permissionCurrent$: Observable<Permission>;

        preliminarySelect = new BehaviorSubject<boolean>(false);

        categoryIds = new FormControl('');
        startDateTour = new FormControl('');
        deadlineTour = new FormControl('');
        preliminary = new FormControl(null);

        topicId = new FormControl('');
        startDateInstruction = new FormControl('');

        createTour: FormGroup = new FormGroup({
            categoryIds: this.categoryIds,
            startDate: this.startDateTour,
            deadline: this.deadlineTour,
            preliminary: this.preliminary
        });

        createInstruction: FormGroup = new FormGroup({
            topicId: this.topicId,
            startDate: this.startDateInstruction
        });
    }

``Observables`` sind Angular-interne Objekte, die dazu dienen den Status bestimmter Services abzufragen und zu siganlisieren
wenn sich deren Variablen ändern. Dazu muss dem ``Observable`` das Ziel in Form eines anderen ``Observable``, die Lebensdauer
und mitgegeben werden, wie es mit den einkommenden Daten verfährt.

Im folgenden Codeabschnitt ist die Anbindung eines ``Observable`` mit ``this.permissionHandler$`` definiert. Das
``this.permissionHandler$`` zeigt auf ein weiteres ``Observable``, was wiederum die Daten aus dem Authentifizierungsservice
bekommt. Die Daten werden noch entstprechend aufbereitet um zu entscheiden, welche Rechte der gerade eingeloggte Nutzer hat.

.. code-block:: javascript

    constructor(private store: Store<AppState>, private authService: AuthService) { }

    ngOnInit() {
        this.permissionCurrent$ = this.authService.guidePermission$;

        this.permissionHandler$ = this.permissionCurrent$.pipe(
            takeUntil(this.destroySubject),
            map(permission => permission.permissionLevel >= PermissionLevel.guide),
            publishReplay(1),
            refCount()
        );

        this.permissionCurrent$.subscribe();
        this.permissionHandler$.subscribe();
        this.preliminarySelect.subscribe( preliminary => {
            if (preliminary) { this.preliminary.setValue(null); }
        });
    }

      ngOnDestroy() {
            this.destroySubject.next(true);
            this.destroySubject.unsubscribe();
      }

Die Funktion ``constructor`` definiert den Konstruktor, welcher widerrum definiert welche Services und Module in Komponente
beim Erstellen ebendieser eingebunden werden sollen. ``ngOnInit`` definiert die initialen Zuweisungen nach Erstellung der
Komponente. Hier werden die ``Observable`` angemeldet und intern verknüpft. Bei der Zerstörung der Komponente wird
``ngOnDestroy`` aktiviert und regelt den Ablauf der Zerstörungs des Objekts (vgl. Destruktor). Hier müssen die ``Observables``
wieder abgemeldet werden, damit diese die Daten nicht weiter veröffentlichen.

In der Dashboard-Komponente sind auch die Funktionen für die Veranstaltungserstellung definiert (``creatingTour`` und
``creatingInstruction``) definiert. Die beiden Funktionen setzen im Endeffekt einen ``POST``-Request mit den entsprechenden
Daten der Formularfelder und den Authentisierungsdaten für das Backend ab.

.. code-block:: javascript

    selectPreliminary() {
        this.preliminarySelect.next(!this.preliminarySelect.value);
    }

    creatingTour(category, startdate, enddate, preliminary) {
        this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe(permission => {
            const guideId = permission.permissionLevel >= PermissionLevel.coordinator ? null : permission.guideId;
            this.store.dispatch(new CreateTour({
                categoryId: category, startDate: startdate, deadline: enddate, preliminary, guideId
            }));
        }).unsubscribe();
    }

    creatingInstruction(topic, startdate) {
        this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe(permission => {
            const guideId = permission.permissionLevel >= PermissionLevel.coordinator ? null : permission.guideId;
            this.store.dispatch(new CreateInstruction({
                topicId: topic, startDate: startdate, guideId
            }));
        }).unsubscribe();
    }

Veranstaltungsmodule
~~~~~~~~~~~~~~~~~~~~
Die Veranstaltungsmodule für Touren, Kurse und Gruppentermine bestehen aus den Zusammenfassungen der Veranstaltungen
in Form einer Liste und der Detailansicht der einzelnen Veranstaltugen. Die Listen sollen eine kurze Zusammenfassung über
den Status der Veranstaltung geben und beim Navigieren zu den Detailansichten helfen. Über die Detailansichten lassen sich
die Details der Veranstaltung einstellen und ändern.

Die Formulare der Veranstaltungsmodule sind dabei ähnlich wie die Dashboard-Komponente aufgebaut. Jedoch sind diese ungleich
komplexer.


Store
~~~~~
Der `ngrx-Store <https://ngrx.io/guide/store>`_ ist ein globales Daten- und Statusmanagement für Angularanwendungen. Die
Daten die vorher mit einem ``GET``-Request vom Backend geladen werden, cacht der Store und die angebundene Angularanwendung
kann sie die Daten dann daraus laden.

Der Store besteht aus fünf unterschiedlichen Bestandteilen: ``Action``, ``Reducer``, ``Selector``, ``Effects`` und dem
damit verknüpften ``Service``.

In ``Action`` sind die verfügbaren Aktionen des Stores definiert. Diese reichen vom Hinzufügen und Löschen von Store-Einträgen
bis hin zum Aktualisieren. Dafür müssen die Typen der ``Action`` deklariert und benannt werden.

.. code-block:: javascript

    import { Action } from '@ngrx/store';

    export enum InstructionActionTypes {
        RequestInstruction = '[Instruction] Request Instruction',
        AddInstruction = '[Instruction] Add Instruction',
        UpsertInstruction = '[Instruction] Upsert Instruction',
        DeleteInstruction = '[Instruction] Delete Instruction',
        CreateInstruction = '[Instruction] Create Instruction',
        CloneInstruction = '[Instruction] Clone Instruction',
    }

Jeder deklarierten ``Action`` wird eine Funktion zugeordnet. Diese Funktion definiert die Payload und den zugehörigen
``ActionType`` einer ``Action``. Der Payload gibt an, was über die ``Action`` mitgeschickt wird.

.. code-block:: javascript

    export class DeleteInstruction implements Action {
        readonly type = InstructionActionTypes.DeleteInstruction;

        constructor(public payload: { id: number }) {}
    }

In dem obigen Fall ist die Payload eine Veranstaltungs-ID. Diese ID ist in dem Fall der Schlüssel zur Veranstaltung,
die gelöscht werden soll.

Nachdem die Namen und der Payload definiert sind, müssen die ``Actions`` noch anderen Komponenten zugänglich gemacht werden.

.. code-block:: javascript

    export type InstructionActions =
        RequestInstruction
        | AddInstruction
        | UpsertInstruction
        | CreateInstruction
        | CloneInstruction;

Die ``Reducer`` bilden das Status-Management ab. Hier wird definiert welche Statusänderungen des Stores durch welche
``Action`` hervorgerufen wird. Dafür muss erst der ``InitialState`` definiert werden. Anschließend werden noch die
Änderungen des Store-Status anhand der ``Actions`` definiert. Dies umschließt die zugehörige ``Timestamp``, den Ladestatus
(``isLoading``) und den eigentlichen Status (``state``).

.. code-block:: javascript

    export const adapter: EntityAdapter<Instruction> = createEntityAdapter<Instruction>();

    export const initialState: State = adapter.getInitialState({
        isLoading: false,
        timestamp: 0
    });

    export function reducer(state = initialState, action: InstructionActions): State {
        switch (action.type) {

        case InstructionActionTypes.InstructionNotModified: {
            return {
                ... state,
                isLoading: false,
                timestamp: new Date().getTime()
            };
        }

        case InstructionActionTypes.RequestInstruction: {
            return {
                ... state,
                isLoading: true
            };
        }
    }

``Selectors`` stellen der anfordernden Komponente bestimmte Informationen des Stores bereit. Dadurch bekommt die Komponente
den aktuellen Status eines bestimmten Storeeintrags. Die Aufgabe des ``Selectors`` ist die Vermittlung der Daten zwischen
Store und Komponente.

.. code-block:: javascript

    import {createFeatureSelector, createSelector} from '@ngrx/store';
    import {State} from './instruction.reducer';

    export const getInstructionState = createFeatureSelector<State>('instructions');

    export const getInstructionById = (instructionId: number) => createSelector(
        getInstructionState, instructionState => instructionState.entities[instructionId]
    );

    export const getInstructionIsLoading = createSelector(getInstructionState, (state: State) => state.isLoading);

Die ``Effects`` definieren die wirklichen Effekte der ``Actions``. Hier lassen sich beispielsweise HTTP-Requests definieren,
die durch die ``Actions`` angestoßen werden und deren Verfahren bei den Antworten der Requests. Die ``Effects`` sind daher
das Verbindungselement zwischen ``Actions`` und dem ``Service``.

.. code-block:: javascript

    export class InstructionEffects {

        constructor(private actions$: Actions, private instructionService: InstructionService, private store: Store<AppState>,
                    private router: Router) { }

        loadInstruction$: Observable<Action> = this.actions$.pipe(
            ofType<RequestInstruction>(InstructionActionTypes.RequestInstruction),
            map((action: RequestInstruction) => action.payload),
            switchMap(payload => {
                return this.instructionService.getInstruction(payload.id).pipe(
                    map(instruction => {
                        if (instruction.id !== 0) {
                        return new AddInstruction({instruction: this.transformInstruction(instruction)});
                        } else {
                            return new InstructionNotModified();
                        }
                    })
                );
            })
        );

        deleteInstruction$: Observable<Action> = this.actions$.pipe(
            ofType<DeleteInstruction>(InstructionActionTypes.DeleteInstruction),
            map((action: DeleteInstruction) => action.payload),
                switchMap((payload) => {
                    return this.instructionService.deleteInstruction(payload.id).pipe(
                        map(instruction => {
                            if (instruction === null) {
                                return new RequestInstructionSummaries();
                            } else {
                                return new InstructionNotModified();
                            }
                        })
                    );
                })
        );

        safeInstruction$: Observable<Action> = this.actions$.pipe(
            ofType<UpsertInstruction>(InstructionActionTypes.UpsertInstruction),
            map((action: UpsertInstruction) => action.payload),
            switchMap(payload  => {
                return this.instructionService.upsertInstruction(this.tranformInstructionForSaving(payload.instruction)).pipe(
                    map(instruction => {
                        if (instruction.id !== 0) {
                            alert('Kurs erfolgreich gespeichert.');
                            const instructionInterface = this.transformInstruction(instruction);
                            this.store.dispatch(new RequestInstructionSummaries());
                            return new UpdateInstruction({instruction: {
                                id: instructionInterface.id,
                                changes: {...instructionInterface}
                            }});
                        } else {
                            alert('Kurs speichern gescheitert, nocheinmal versuchen oder Seite neuladen.');
                            return new InstructionNotModified();
                        }
                    })
                );
            })
        );
    }

Der ``Service`` ist für die direkte Kommunkikation mit der API zuständig und ruft deren Daten ab. Dabei braucht der ``Service``
die Formatierung der Daten und das Abrufziel. Mittels des eingebundenen ``HTTP-Client`` holt der ``Service`` die Daten ab.
Der Aufbau eines ``Services`` ist exemplarisch unten abgebildet.

.. code-block:: javascript

    export class InstructionService {

        etag: string;

        constructor(private http: HttpClient) { }

        getInstruction(id: number): Observable<Instruction> {
            const headers = {
                Accept: 'application/json',
                'Accept-Language': 'de',
                'Content-Encoding': 'gzip',
                // 'Cache-Control': 'no-cache'
            };

            if (!id) {
                return of ({id: 0} as Instruction);
            }

            if (this.etag) {
                headers['If-None-Match'] = this.etag;
            }

            return this.http.get<Instruction>(
                `/api/frontend/instructions/${id}/`,
                {headers: new HttpHeaders(headers), observe: 'response'}
            ).pipe(
                catchError((error: HttpErrorResponse): Observable<Instruction> => {
                    console.log(error.statusText, error.status);
                    return of ({id: 0} as Instruction);
                }),
                map((response: HttpResponse<Instruction>): Instruction => {
                    const responseHeaders = response.headers;
                    if (responseHeaders) {
                        if (responseHeaders.keys().indexOf('etag') > -1) {
                            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
                        }
                        return response.body as Instruction;
                    } else {
                        return {id: 0} as Instruction;
                    }
                }),
                first(),
                publishReplay(1),
                refCount()
            );
        }
    }

Formularkomponenten
~~~~~~~~~~~~~~~~~~~
Die einzelnen Formulare sind wiederum aus verschiedenen, eigenständigen Komponenten aufgebaut. Die einzelnen Komponenten
beispielsweise geben Datenfeldern für Datum, Uhrzeit oder verschiedene Dropdown eine Form und bilden deren Wirkungsweise ab.
Jeden Komponente besteht dabei aus Funktion und äußerem Erscheinungsbild.

Für das äußere Erscheinungsbild nutzen wir `PrimeNG <https://www.primefaces.org/primeng/#/>`_. Das Verhalten von
PrimeNG-Komponenten ist z. T. schon vordefiniert aber kann dennoch auch noch angepasst werden. Die Komponente und deren
Parameter müssen in ``HTML`` definiert und dann mit den Funktionen der Komponente verknüpft werden.

.. code-block:: none

    <p-dropdown
        [options]="stateSubject.value"
        optionLabel="state"
        [readonly]="readonly"
        [disabled]="this.disableSubject.value"
        placeholder="Bearbeitungsstand"
    >
    </p-dropdown>

Die Komponente an sich bindet den ``HTML``-Quellcode ein und schafft die Verbindung zu den Funktionen. Zusätzlich lassen
sich in der Komponente verschiedene Parameter und deren Verfahren steuern. Der folgende Quellcode zeigt den Aufbau einer
solchen Komponente anhand eines Dropdown-Menüs.

.. code-block:: javascript

    export class DropdownComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor  {

        formControl: FormControl;
        delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();


        formState$: Observable<StateState>;
        formStateComponent$: Observable<StateState>;

        set readOnly(value: boolean) {
            this.readonly = value;
        }

        set disable(value: boolean) {
            this.disableSubject.next(value);
        }

        group = new FormGroup({
                original: this.originalControl,
                choice: this.choiceControl,
            },
            [stateValidator]
        );

        status: RawState[] = new Array(0);

        OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawState) => void {
            return ((state: RawState): void => {
            this.formControl.setValue(state);
            this.choiceControl.setValue(state);
            onChange(state.id);
            });
        }

        registerOnChange(fn: any): void {
            this.delegatedMethodCalls.next(accessor => accessor.registerOnChange(this.OnChangeWrapper(fn)));
        }

        registerOnTouched(fn: any): void {
            this.delegatedMethodCalls.next(accessor => accessor.registerOnTouched(fn));
        }

        writeValue(stateId): void {
            if (typeof stateId === 'number' && stateId > 0) {
                for (const el in this.status) {
                    if (stateId === this.status[el].id) {
                        stateId = this.status[stateId - 1];
                    }
                }
            }

            this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
        }

        constructor(private store: Store<AppState>) { }

        ngOnInit(): void {

            this.formState$ = this.store.select(selectStatesState);

            this.formStateComponent$ = this.formState$.pipe(
                takeUntil(this.destroySubject),
                tap( (state) => {
                    Object.keys(state.entities).forEach(key => {
                        this.status.push(state.entities[key]);
                    });
                    if (this.trainerstate && !this.disableSubject.value) {
                        this.status = this.status.slice(0, 2);
                    }
                    this.stateSubject.next(this.status);
                }),
                publishReplay(1),
                refCount()
            );

            this.formStateComponent$.subscribe();
        }


        ngAfterViewInit(): void {
            this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
                delay(0),
            ).subscribe(fn => fn(this.dropdown));
        }

        ngOnDestroy(): void {
            if (this.delegatedMethodsSubscription) {
                this.delegatedMethodsSubscription.unsubscribe();
            }
            this.destroySubject.next();
            this.destroySubject.complete();
        }

        ngAfterContentInit(): void {
            this.formControl = this.formControlNameRef.control;
            this.originalControl.setValue(this.formControl);
            this.choiceControl.setValue(this.formControl.value);
        }
    }

Die Komponenten sind dynamisch aufgebaut und bekommen ihren Grundstock an Daten aus dem angebundenen Store. Dies erlaubt
eine dynamische Nutzung der Komponente und erspart die jeweilige, getrennte Initialsierung verschiedener Komponentenarten.

Das Sprekturm der Komponenten reicht dabei von Dropdown- bis hin zu Datumskomponenten.
