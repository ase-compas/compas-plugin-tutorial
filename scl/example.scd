<?xml version="1.0" encoding="UTF-8"?>
<!-- A tiny SCL document to open in the dev shell while trying the examples. -->
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B" release="4">
  <Header id="example" version="1" revision="1" toolID="open-scd-plugins"/>
  <Substation name="Substation A" desc="Demo substation">
    <VoltageLevel name="V1" nomFreq="50" numPhases="3">
      <Bay name="Bay A"/>
    </VoltageLevel>
  </Substation>
  <IED name="IED1" type="Demo" manufacturer="CoMPAS">
    <AccessPoint name="AP1"/>
  </IED>
  <IED name="IED2" type="Demo" manufacturer="CoMPAS">
    <AccessPoint name="AP1"/>
  </IED>
  <IED name="IED3" type="Demo" manufacturer="CoMPAS">
    <AccessPoint name="AP1"/>
  </IED>
</SCL>
