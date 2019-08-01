import {Instruction} from "./store/instruction.model";
import {FormControl, FormGroup} from "@angular/forms";
import {Category, Topic} from "../model/value";
import {Event} from "../model/event";

export function instructionGroupFactory(instruction: Instruction): FormGroup {
  return new FormGroup({
    id: new FormControl(instruction.id),
    reference: new FormControl(instruction.reference),
    guideId: new FormControl(instruction.guideId),
    teamIds: new FormControl(instruction.teamIds),
    topicId: new FormControl(instruction.topicId),
    instructionId: new FormControl(instruction.instructionId),
    meetingIds: new FormControl(instruction.meetingIds),
    lowEmissionAdventure: new FormControl(instruction.lowEmissionAdventure),
    ladiesOnly: new FormControl(instruction.ladiesOnly),
    isSpecial: new FormControl(instruction.isSpecial),
    categoryId: new FormControl(instruction.categoryId),
    qualificationIds: new FormControl(instruction.qualificationIds),
    preconditions: new FormControl(instruction.preconditions),
    equipmentIds: new FormControl(instruction.equipmentIds),
    miscEquipment: new FormControl(instruction.miscEquipment),
    equipmentService: new FormControl(instruction.equipmentService),
    admission: new FormControl((instruction.admission / 100).toFixed(2)),
    advances: new FormControl((instruction.advances / 100).toFixed(2)),
    advancesInfo: new FormControl(instruction.advancesInfo),
    extraCharges: new FormControl((instruction.extraCharges / 100).toFixed(2)),
    extraChargesInfo: new FormControl(instruction.extraChargesInfo),
    minQuantity: new FormControl(instruction.minQuantity),
    maxQuantity: new FormControl(instruction.maxQuantity),
    curQuantity: new FormControl(instruction.curQuantity),
    stateId: new FormControl(instruction.stateId)
  });
}

export function topicGroupFactory(topic: Topic): FormGroup {
  return new FormGroup({
    id: new FormControl(topic.id),
    code: new FormControl(topic.code),
    title: new FormControl(topic.title),
    name: new FormControl(topic.name),
    description: new FormControl(topic.description),
    preconditions: new FormControl(topic.preconditions),
    qualificationIds: new FormControl(topic.qualificationIds),
    equipmentIds: new FormControl(topic.equipmentIds),
    miscEquipment: new FormControl(topic.miscEquipment)
  });
}

export function categoryGroupFactory(category: Category): FormGroup {
  return new FormGroup({
    id: new FormControl(category.id),
    code: new FormControl(category.code),
    name: new FormControl(category.name),
    tour: new FormControl(category.tour),
    talk: new FormControl(category.talk),
    instruction: new FormControl(category.instruction),
    collective: new FormControl(category.collective),
    winter: new FormControl(category.winter),
    summer: new FormControl(category.summer),
    indoor: new FormControl(category.indoor),
  });
}

export function eventGroupFactory(event: Event): FormGroup {
  return new FormGroup({
    id: new FormControl(event.id),
    title: new FormControl(event.title),
    name: new FormControl(event.name),
    description: new FormControl(event.description),
    startDate: new FormControl(event.startDate),
    startTime: new FormControl(event.startTime),
    approximateId: new FormControl(event.approximateId),
    endDate: new FormControl(event.endDate),
    rendezvous: new FormControl(event.rendezvous),
    location: new FormControl(event.location),
    reservationService: new FormControl(event.reservationService),
    source: new FormControl(event.source),
    link: new FormControl(event.link),
    map: new FormControl(event.map),
    distal: new FormControl(event.distal),
    distance: new FormControl({value: event.distance, disabled: !event.distal}),
    publicTransport: new FormControl(event.publicTransport),
    shuttleService: new FormControl(event.shuttleService)
  });
}

export function tourGroupFactory(tour: Tour): FormGroup {
  return new FormGroup({
    id: new FormControl(instruction.id),
    reference: new FormControl(instruction.reference),
    guideId: new FormControl(instruction.guideId),
    teamIds: new FormControl(instruction.teamIds),
    topicId: new FormControl(instruction.topicId),
    instructionId: new FormControl(instruction.instructionId),
    meetingIds: new FormControl(instruction.meetingIds),
    lowEmissionAdventure: new FormControl(instruction.lowEmissionAdventure),
    ladiesOnly: new FormControl(instruction.ladiesOnly),
    isSpecial: new FormControl(instruction.isSpecial),
    categoryId: new FormControl(instruction.categoryId),
    qualificationIds: new FormControl(instruction.qualificationIds),
    preconditions: new FormControl(instruction.preconditions),
    equipmentIds: new FormControl(instruction.equipmentIds),
    miscEquipment: new FormControl(instruction.miscEquipment),
    equipmentService: new FormControl(instruction.equipmentService),
    admission: new FormControl((instruction.admission / 100).toFixed(2)),
    advances: new FormControl((instruction.advances / 100).toFixed(2)),
    advancesInfo: new FormControl(instruction.advancesInfo),
    extraCharges: new FormControl((instruction.extraCharges / 100).toFixed(2)),
    extraChargesInfo: new FormControl(instruction.extraChargesInfo),
    minQuantity: new FormControl(instruction.minQuantity),
    maxQuantity: new FormControl(instruction.maxQuantity),
    curQuantity: new FormControl(instruction.curQuantity),
    stateId: new FormControl(instruction.stateId)
  });
}
